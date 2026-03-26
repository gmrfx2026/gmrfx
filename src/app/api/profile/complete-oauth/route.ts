import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toMemberSlug } from "@/lib/memberSlug";

const schema = z.object({
  name: z.string().min(2).max(120),
  phoneWhatsApp: z.string().min(10).max(20),
  addressLine: z.string().min(3).max(200),
  kecamatan: z.string().min(2).max(80),
  kabupaten: z.string().min(2).max(80),
  provinsi: z.string().min(2).max(80),
  kodePos: z.string().min(3).max(12),
  negara: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }
  if (user.passwordHash) {
    return NextResponse.json({ error: "Akun ini sudah memakai password email" }, { status: 400 });
  }

  const d = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      phoneWhatsApp: d.phoneWhatsApp,
      addressLine: d.addressLine,
      kecamatan: d.kecamatan,
      kabupaten: d.kabupaten,
      provinsi: d.provinsi,
      kodePos: d.kodePos,
      negara: d.negara,
      profileComplete: true,
      memberSlug: toMemberSlug(d.name, user.id),
    },
  });

  return NextResponse.json({ ok: true });
}
