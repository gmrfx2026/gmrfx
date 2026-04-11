import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";
import { MemberStatus } from "@prisma/client";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({})) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, memberStatus: true, phoneWhatsApp: true },
  });
  if (!user || user.memberStatus !== MemberStatus.PENDING) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau sudah aktif" }, { status: 404 });
  }
  if (!user.phoneWhatsApp) {
    return NextResponse.json({ error: "Nomor WhatsApp tidak ditemukan" }, { status: 400 });
  }

  await createOtp(user.id, "PHONE_VERIFY", user.phoneWhatsApp);
  return NextResponse.json({ ok: true });
}
