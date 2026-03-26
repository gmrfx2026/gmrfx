import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateUniqueWalletAddress } from "@/lib/wallet";
import { toMemberSlug } from "@/lib/memberSlug";

export const maxDuration = 60;

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phoneWhatsApp: z.string().min(10).max(20),
  addressLine: z.string().min(3).max(200),
  kecamatan: z.string().min(2).max(80),
  kabupaten: z.string().min(2).max(80),
  provinsi: z.string().min(2).max(80),
  kodePos: z.string().min(3).max(12),
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

    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    // Satu INSERT saja: lebih aman dengan Neon pooler (hindari interactive transaction + kurangi round-trip).
    const passwordHash = await bcrypt.hash(d.password, 10);
    const walletAddress = await generateUniqueWalletAddress(prisma);
    const id = randomUUID();
    const memberSlug = toMemberSlug(d.name, id);
    await prisma.user.create({
      data: {
        id,
        email,
        name: d.name,
        passwordHash,
        phoneWhatsApp: d.phoneWhatsApp,
        addressLine: d.addressLine,
        kecamatan: d.kecamatan,
        kabupaten: d.kabupaten,
        provinsi: d.provinsi,
        kodePos: d.kodePos,
        negara: d.negara,
        profileComplete: true,
        walletAddress,
        memberSlug,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("register", e);
    if (e instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        const fields = e.meta?.target as string[] | undefined;
        if (fields?.includes("email")) {
          return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
        }
        if (fields?.includes("walletAddress") || fields?.includes("memberSlug")) {
          return NextResponse.json({ error: "Coba lagi sebentar (konflik data sementara)" }, { status: 409 });
        }
        return NextResponse.json({ error: "Data bentrok dengan pengguna lain" }, { status: 409 });
      }
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json({ error: "Koneksi database gagal. Coba lagi nanti." }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
  }
}
