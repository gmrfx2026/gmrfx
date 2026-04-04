import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";

const COOLDOWN_MS = 60 * 1000; // 1 menit antar permintaan

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneWhatsApp: true, memberStatus: true },
  });

  if (!user || user.memberStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
  }

  if (!user.phoneWhatsApp) {
    return NextResponse.json(
      { error: "Nomor WhatsApp belum terdaftar. Perbarui profil terlebih dahulu." },
      { status: 400 }
    );
  }

  // Rate-limit: cek OTP yang baru dikirim dalam 1 menit terakhir
  const recent = await prisma.otpChallenge.findFirst({
    where: {
      userId: session.user.id,
      purpose: "WITHDRAW",
      consumed: false,
      createdAt: { gte: new Date(Date.now() - COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const wait = Math.ceil((recent.createdAt.getTime() + COOLDOWN_MS - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Tunggu ${wait} detik sebelum meminta OTP baru.`, wait },
      { status: 429 }
    );
  }

  await createOtp(session.user.id, "WITHDRAW", user.phoneWhatsApp);

  const maskedPhone = user.phoneWhatsApp.replace(/(\d{4})\d+(\d{4})/, "$1****$2");
  return NextResponse.json({ ok: true, maskedPhone });
}
