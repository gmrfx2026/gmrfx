import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OtpPurpose } from "@prisma/client";
import { createOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const purpose = body.purpose as OtpPurpose;
  if (purpose !== "PHONE_UPDATE" && purpose !== "PASSWORD_CHANGE") {
    return NextResponse.json({ error: "Purpose tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.phoneWhatsApp) {
    return NextResponse.json({ error: "Nomor HP belum terdaftar" }, { status: 400 });
  }

  await createOtp(user.id, purpose, user.phoneWhatsApp);

  return NextResponse.json({
    ok: true,
    message:
      process.env.NODE_ENV === "development"
        ? "OTP dicetak di log server (atau gunakan DEV_OTP_CODE di .env)"
        : "OTP dikirim ke nomor terdaftar (sambungkan SMS gateway)",
  });
}
