import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OtpPurpose } from "@prisma/client";
import { verifyOtp } from "@/lib/otp";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const newPassword = String(body.newPassword ?? "");
  const code = String(body.code ?? "").trim();
  if (newPassword.length < 8 || !code) {
    return NextResponse.json({ error: "Password minimal 8 karakter & OTP wajib" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.phoneWhatsApp) {
    return NextResponse.json({ error: "Nomor HP belum terdaftar" }, { status: 400 });
  }
  if (!user.passwordHash) {
    return NextResponse.json({ error: "Akun ini memakai login Google" }, { status: 400 });
  }

  const ok = await verifyOtp(user.id, OtpPurpose.PASSWORD_CHANGE, user.phoneWhatsApp, code);
  if (!ok) {
    return NextResponse.json({ error: "OTP salah atau kadaluarsa" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
