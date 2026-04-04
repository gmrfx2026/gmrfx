import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, code, newPassword, confirmPassword } =
    await req.json().catch(() => ({})) as {
      email?: string; code?: string; newPassword?: string; confirmPassword?: string;
    };

  if (!email || !code || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Konfirmasi password tidak cocok" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.passwordHash || !user.phoneWhatsApp) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau menggunakan login Google" }, { status: 404 });
  }

  const ok = await verifyOtp(user.id, "PASSWORD_RESET", user.phoneWhatsApp, String(code).trim());
  if (!ok) {
    return NextResponse.json({ error: "Kode OTP salah atau sudah kedaluwarsa" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
