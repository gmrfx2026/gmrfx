/** Masa berlangganan Copy / Ikuti (gratis maupun berbayar): ~30 hari. */
export const COMMUNITY_SUBSCRIPTION_MS = 30 * 24 * 60 * 60 * 1000;

/** @deprecated gunakan COMMUNITY_SUBSCRIPTION_MS */
export const COMMUNITY_PAID_SUBSCRIPTION_MS = COMMUNITY_SUBSCRIPTION_MS;

export function paidSubscriptionExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + COMMUNITY_SUBSCRIPTION_MS);
}

/**
 * Langganan aktif jika expiresAt > sekarang.
 * expiresAt null dipertahankan hanya untuk data lama (gratis sebelum kebijakan ini);
 * semua langganan baru selalu menyimpan expiresAt.
 */
export function isCommunitySubscriptionActive(expiresAt: Date | null | undefined): boolean {
  if (expiresAt == null) return true; // backward-compat data lama
  return expiresAt.getTime() > Date.now();
}

/** Klausa Prisma: langganan masih berlaku (gratis atau belum lewat). */
export function activeCommunitySubscriptionWhere() {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}
