import { prisma } from "@/lib/prisma";

export const MT_LOGIN_PARAM_MAX_LEN = 32;

/** Normalisasi login MetaTrader dari input API (sama order of magnitude dengan ingest). */
export function parseMtLoginParam(raw: unknown): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || s.length > MT_LOGIN_PARAM_MAX_LEN) return null;
  if (!/^[0-9A-Za-z_-]+$/.test(s)) return null;
  return s;
}

/** True jika user punya data portofolio/komunitas untuk login ini (boleh dihapus). */
export async function userOwnsPortfolioMtLogin(userId: string, mtLogin: string): Promise<boolean> {
  const [deals, snaps, activity, published] = await Promise.all([
    prisma.mtDeal.count({ where: { userId, mtLogin } }),
    prisma.mtAccountSnapshot.count({ where: { userId, mtLogin } }),
    prisma.mtTradingActivity.count({ where: { userId, mtLogin } }),
    prisma.mtCommunityPublishedAccount.count({ where: { userId, mtLogin } }),
  ]);
  return deals + snaps + activity + published > 0;
}

/**
 * Hapus seluruh data situs untuk pasangan (userId, mtLogin): deal, snapshot, aktivitas,
 * publikasi komunitas, serta langganan Copy / Ikuti ke akun ini (penerbit = user).
 */
export async function deleteUserPortfolioMtAccount(userId: string, mtLogin: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.mtDeal.deleteMany({ where: { userId, mtLogin } });
    await tx.mtAccountSnapshot.deleteMany({ where: { userId, mtLogin } });
    await tx.mtTradingActivity.deleteMany({ where: { userId, mtLogin } });
    await tx.mtCommunityPublishedAccount.deleteMany({ where: { userId, mtLogin } });
    await tx.mtCopyFollow.deleteMany({ where: { publisherUserId: userId, mtLogin } });
    await tx.mtCommunityActivityWatch.deleteMany({ where: { publisherUserId: userId, mtLogin } });
  });
}
