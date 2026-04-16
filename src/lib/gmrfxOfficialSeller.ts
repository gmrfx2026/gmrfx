import { prisma } from "@/lib/prisma";

/** Key `SystemSetting` untuk ID user penjual resmi (jika env tidak diisi). */
export const GMRFX_OFFICIAL_SELLER_SETTING_KEY = "gmrfx_official_seller_user_id";

/**
 * User penjual untuk indikator resmi GMRFX (escrow/pembelian mengarah ke akun ini).
 * Prioritas: env `GMRFX_OFFICIAL_SELLER_USER_ID`, lalu SystemSetting `gmrfx_official_seller_user_id`.
 */
export async function getGmrfxOfficialSellerId(): Promise<string | null> {
  const envId = process.env.GMRFX_OFFICIAL_SELLER_USER_ID?.trim();
  if (envId) return envId;
  const row = await prisma.systemSetting.findUnique({ where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY } });
  const v = row?.value?.trim();
  return v && v.length > 0 ? v : null;
}

export function getGmrfxOfficialSellerIdFromEnvOnly(): string | null {
  const envId = process.env.GMRFX_OFFICIAL_SELLER_USER_ID?.trim();
  return envId && envId.length > 0 ? envId : null;
}
