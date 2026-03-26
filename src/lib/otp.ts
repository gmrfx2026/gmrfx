import { OtpPurpose } from "@prisma/client";
import { prisma } from "./prisma";

const OTP_TTL_MS = 10 * 60 * 1000;

function randomSixDigit(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Buat OTP. Di development, cek konsol server atau gunakan DEV_OTP_CODE. */
export async function createOtp(
  userId: string,
  purpose: OtpPurpose,
  phone: string
): Promise<string> {
  const dev = process.env.DEV_OTP_CODE;
  const code = dev && dev.length >= 4 ? dev : randomSixDigit();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.create({
    data: { userId, purpose, phone, code, expiresAt },
  });

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[OTP ${purpose}] user=${userId} phone=${phone} code=${code} (sambungkan SMS gateway di production)`
    );
  }

  return code;
}

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  phone: string,
  code: string
): Promise<boolean> {
  const dev = process.env.DEV_OTP_CODE;
  if (dev && code === dev) {
    await prisma.otpChallenge.updateMany({
      where: { userId, purpose, phone, consumed: false },
      data: { consumed: true },
    });
    return true;
  }

  const row = await prisma.otpChallenge.findFirst({
    where: {
      userId,
      purpose,
      phone,
      code,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return false;

  await prisma.otpChallenge.update({
    where: { id: row.id },
    data: { consumed: true },
  });
  return true;
}
