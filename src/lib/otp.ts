import { OtpPurpose } from "@prisma/client";
import { prisma } from "./prisma";
import { getOtpFixedTestingConfig } from "./otpFixedSettings";
import { getSiteName } from "./siteNameSettings";

const OTP_TTL_MS = 10 * 60 * 1000;

function randomSixDigit(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Kirim OTP via WhatsApp menggunakan Fonnte.
 * Set FONNTE_TOKEN di environment variable.
 * Jika tidak ada token (dev), kode dicetak ke console.
 */
async function sendOtpWhatsApp(phone: string, code: string): Promise<void> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.info(`[OTP-DEV] code=${code} phone=${phone} (set FONNTE_TOKEN di .env untuk kirim WhatsApp)`);
    return;
  }

  // Normalisasi nomor: hapus +, 0 di depan ganti 62
  let target = phone.replace(/\D/g, "");
  if (target.startsWith("0")) target = "62" + target.slice(1);
  if (!target.startsWith("62")) target = "62" + target;

  const siteName = await getSiteName();
  const message =
    `Kode OTP ${siteName} Anda: *${code}*\n\n` +
    `Berlaku 10 menit. Jangan bagikan kode ini kepada siapapun.\n\n` +
    `Abaikan jika Anda tidak merasa meminta kode ini.`;

  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target,
      message,
      countryCode: "62",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[OTP] Fonnte gagal (${res.status}): ${body}`);
  }
}

/** Buat dan kirim OTP. */
export async function createOtp(
  userId: string,
  purpose: OtpPurpose,
  phone: string
): Promise<string> {
  const envDev = process.env.DEV_OTP_CODE?.trim();
  const adminFixed = await getOtpFixedTestingConfig();
  const code =
    envDev && envDev.length >= 4
      ? envDev
      : adminFixed.enabled && adminFixed.code.length >= 4
        ? adminFixed.code
        : randomSixDigit();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.create({
    data: { userId, purpose, phone, code, expiresAt },
  });

  await sendOtpWhatsApp(phone, code);

  return code;
}

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  phone: string,
  code: string
): Promise<boolean> {
  const envDev = process.env.DEV_OTP_CODE?.trim();
  if (envDev && envDev.length >= 4 && code === envDev) {
    await prisma.otpChallenge.updateMany({
      where: { userId, purpose, phone, consumed: false },
      data: { consumed: true },
    });
    return true;
  }

  const adminFixed = await getOtpFixedTestingConfig();
  if (adminFixed.enabled && adminFixed.code && code === adminFixed.code) {
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
