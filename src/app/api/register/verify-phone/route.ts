import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const { email, code } = await req.json().catch(() => ({})) as { email?: string; code?: string };
  if (!email || !code) {
    return NextResponse.json({ error: "Email dan kode OTP wajib diisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }
  if (user.memberStatus === "ACTIVE") {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }
  if (!user.phoneWhatsApp) {
    return NextResponse.json({ error: "Nomor WhatsApp tidak ditemukan" }, { status: 400 });
  }

  const ok = await verifyOtp(user.id, "PHONE_VERIFY", user.phoneWhatsApp, String(code).trim());
  if (!ok) {
    return NextResponse.json({ error: "Kode OTP salah atau sudah kedaluwarsa" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { memberStatus: "ACTIVE" },
  });

  return NextResponse.json({ ok: true });
}
