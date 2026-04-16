import { prisma } from "@/lib/prisma";

/** Jika "1", semua OTP memakai kode tetap (hanya untuk pengujian). */
export const OTP_FIXED_FOR_TESTING_KEY = "otp_fixed_for_testing";
/** Nilai kode 6 digit (default123456). */
export const OTP_FIXED_CODE_KEY = "otp_fixed_code";

export const DEFAULT_OTP_FIXED_CODE = "123456";

export function isOtpFixedForTesting(value: string | null | undefined): boolean {
  return value === "1";
}

/** Kode 6 digit; jika tidak valid, kembalikan default. */
export function normalizeOtpFixedCode(raw: string | null | undefined): string {
  const t = String(raw ?? "").trim();
  if (/^\d{6}$/.test(t)) return t;
  return DEFAULT_OTP_FIXED_CODE;
}

export async function getOtpFixedTestingConfig(): Promise<{ enabled: boolean; code: string }> {
  const [flag, codeRow] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: OTP_FIXED_FOR_TESTING_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: OTP_FIXED_CODE_KEY } }),
  ]);
  const enabled = isOtpFixedForTesting(flag?.value);
  const code = normalizeOtpFixedCode(codeRow?.value);
  return { enabled, code };
}
