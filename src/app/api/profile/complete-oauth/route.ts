import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toMemberSlug } from "@/lib/memberSlug";
import { resolveWilayahByDistrictId } from "@/lib/wilayahIndonesia";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phoneWhatsApp: z.string().trim().min(10).max(20),
  addressLine: z.string().trim().min(3).max(200),
  districtCode: z.string().regex(/^\d{7}$/, "Pilih kecamatan dari daftar"),
  kodePos: z.string().regex(/^\d{5}$/, "Kode pos harus 5 angka"),
  negara: z.string().trim().min(2).max(80),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const hint = Object.entries(first)
      .map(([k, v]) => (Array.isArray(v) && v[0] ? `${k}: ${v[0]}` : null))
      .filter(Boolean)
      .join(" · ");
    return NextResponse.json(
      { error: hint || "Data tidak valid. Periksa semua kolom.", fields: first },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if (user.profileComplete) {
    return NextResponse.json({ error: "Profil sudah lengkap." }, { status: 400 });
  }

  const d = parsed.data;
  const wilayah = await resolveWilayahByDistrictId(d.districtCode);
  if (!wilayah) {
    return NextResponse.json(
      { error: "Kecamatan tidak valid atau data wilayah belum diisi di server." },
      { status: 400 }
    );
  }

  let memberSlug = toMemberSlug(d.name, user.id);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: d.name,
        phoneWhatsApp: d.phoneWhatsApp,
        addressLine: d.addressLine,
        kecamatan: wilayah.kecamatan,
        kabupaten: wilayah.kabupaten,
        provinsi: wilayah.provinsi,
        kodePos: d.kodePos,
        negara: d.negara,
        profileComplete: true,
        memberSlug,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      memberSlug = `${memberSlug}-${user.id.slice(-4)}`;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: d.name,
          phoneWhatsApp: d.phoneWhatsApp,
          addressLine: d.addressLine,
          kecamatan: wilayah.kecamatan,
          kabupaten: wilayah.kabupaten,
          provinsi: wilayah.provinsi,
          kodePos: d.kodePos,
          negara: d.negara,
          profileComplete: true,
          memberSlug,
        },
      });
    } else {
      console.error("complete-oauth update", e);
      return NextResponse.json({ error: "Gagal menyimpan. Coba lagi." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
