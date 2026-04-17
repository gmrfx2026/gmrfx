import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma, MemberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateUniqueWalletAddress } from "@/lib/wallet";
import { toMemberSlug } from "@/lib/memberSlug";
import { resolveWilayahByDistrictId } from "@/lib/wilayahIndonesia";
import { createOtp } from "@/lib/otp";
import { MANUAL_PHONE_VERIFY_KEY, isManualPhoneVerifyRequired } from "@/lib/oauthPhoneVerifySettings";
import { normalizePhoneE164, phoneVariants } from "@/lib/phoneNormalize";

export const maxDuration = 60;

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phoneWhatsApp: z.string().min(10).max(20),
  addressLine: z.string().min(3).max(200),
  districtCode: z.string().regex(/^\d{7}$/, "Pilih kecamatan dari daftar"),
  kodePos: z.string().regex(/^\d{5}$/, "Kode pos harus 5 angka"),
  negara: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const email = d.email.toLowerCase().trim();

    const normalizedPhone = normalizePhoneE164(d.phoneWhatsApp);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxxx atau +62812xxxxxxxx." },
        { status: 400 }
      );
    }

    const wilayah = await resolveWilayahByDistrictId(d.districtCode);
    if (!wilayah) {
      return NextResponse.json(
        { error: "Kecamatan tidak valid atau data wilayah belum diisi di server." },
        { status: 400 }
      );
    }

    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) {
      // Jika akun PENDING dan nomor (normalized) sama, izinkan kirim ulang OTP.
      const dupNorm = normalizePhoneE164(dup.phoneWhatsApp);
      if (dup.memberStatus === MemberStatus.PENDING && dupNorm === normalizedPhone) {
        await createOtp(dup.id, "PHONE_VERIFY", normalizedPhone);
        return NextResponse.json({ ok: true, pending: true, email });
      }
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    /** Cek duplikat nomor WA (cover variasi format lama: `+62…`, `0…`, `62…`). */
    const phoneDup = await prisma.user.findFirst({
      where: { phoneWhatsApp: { in: phoneVariants(normalizedPhone) } },
      select: { id: true },
    });
    if (phoneDup) {
      return NextResponse.json({ error: "Nomor WhatsApp sudah terdaftar" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(d.password, 10);
    const walletAddress = await generateUniqueWalletAddress(prisma);
    const id = randomUUID();
    const memberSlug = toMemberSlug(d.name, id);

    // Cek setting: apakah verifikasi HP wajib untuk pendaftaran manual?
    const verifySetting = await prisma.systemSetting.findUnique({ where: { key: MANUAL_PHONE_VERIFY_KEY } });
    const requireVerify = isManualPhoneVerifyRequired(verifySetting?.value);

    await prisma.user.create({
      data: {
        id,
        email,
        name: d.name,
        passwordHash,
        phoneWhatsApp: normalizedPhone,
        addressLine: d.addressLine,
        kecamatan: wilayah.kecamatan,
        kabupaten: wilayah.kabupaten,
        provinsi: wilayah.provinsi,
        kodePos: d.kodePos,
        negara: d.negara,
        profileComplete: true,
        walletAddress,
        memberSlug,
        memberStatus: requireVerify ? MemberStatus.PENDING : MemberStatus.ACTIVE,
      },
    });

    if (requireVerify) {
      // Kirim OTP verifikasi nomor WA
      await createOtp(id, "PHONE_VERIFY", normalizedPhone);
      return NextResponse.json({ ok: true, pending: true, email });
    }

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    console.error("register", e);
    if (e instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        const fields = e.meta?.target as string[] | undefined;
        if (fields?.includes("email")) {
          return NextResponse.json({ error: "Email sudah terdaftar", prismaCode: "P2002" }, { status: 409 });
        }
        return NextResponse.json({ error: "Coba lagi sebentar (konflik data sementara)", prismaCode: "P2002" }, { status: 409 });
      }
      return NextResponse.json({ error: "Gagal mendaftar", prismaCode: e.code, hint: e.message }, { status: 500 });
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ error: "Koneksi database gagal. Coba lagi nanti.", prismaCode: "INIT" }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message.slice(0, 180) : "";
    return NextResponse.json({ error: "Gagal mendaftar", prismaCode: "OTHER", ...(msg ? { hint: msg } : {}) }, { status: 500 });
  }
}
