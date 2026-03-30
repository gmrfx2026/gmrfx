/** Masa berlangganan berbayar Copy / Ikuti (alert), dalam milidetik (~30 hari). */
export const COMMUNITY_PAID_SUBSCRIPTION_MS = 30 * 24 * 60 * 60 * 1000;

export function paidSubscriptionExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + COMMUNITY_PAID_SUBSCRIPTION_MS);
}

/** Gratis: expiresAt null = aktif selamanya. Berbayar: aktif jika expiresAt > sekarang. */
export function isCommunitySubscriptionActive(expiresAt: Date | null | undefined): boolean {
  if (expiresAt == null) return true;
  return expiresAt.getTime() > Date.now();
}

/** Klausa Prisma: langganan masih berlaku (gratis atau belum lewat). */
export function activeCommunitySubscriptionWhere() {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}
