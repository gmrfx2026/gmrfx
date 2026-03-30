import { prisma } from "@/lib/prisma";

export type MtCommunityPublishRow = {
  mtLogin: string;
  tradeAccountName: string | null;
  /** Nama di profil website; dipakai tampilan jika tradeAccountName dari broker kosong. */
  ownerWebsiteName: string | null;
  sourcePlatform: string | null;
  brokerName: string | null;
  brokerServer: string | null;
  allowCopy: boolean;
  allowWatch: boolean;
  copyFree: boolean;
  copyPriceIdr: number;
  watchAlertFree: boolean;
  watchAlertPriceIdr: number;
  platform: string;
};

/** Login MT milik user + setelan publikasi komunitas + meta snapshot terakhir. */
export async function loadMtCommunityPublishRows(userId: string): Promise<MtCommunityPublishRow[]> {
  const [fromDeals, fromSnaps] = await Promise.all([
    prisma.mtDeal.groupBy({ by: ["mtLogin"], where: { userId } }),
    prisma.mtAccountSnapshot.groupBy({ by: ["mtLogin"], where: { userId } }),
  ]);

  const set = new Set<string>();
  for (const r of fromDeals) set.add(r.mtLogin);
  for (const r of fromSnaps) set.add(r.mtLogin);
  const mtLogins = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (mtLogins.length === 0) return [];

  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const ownerWebsiteName = owner?.name?.trim() ? owner.name.trim() : null;

  const published = await prisma.mtCommunityPublishedAccount.findMany({
    where: { userId },
  });
  const pubMap = new Map(published.map((p) => [p.mtLogin, p]));

  const snaps = await prisma.mtAccountSnapshot.findMany({
    where: { userId, mtLogin: { in: mtLogins } },
    orderBy: { recordedAt: "desc" },
    select: {
      mtLogin: true,
      tradeAccountName: true,
      sourcePlatform: true,
      brokerName: true,
      brokerServer: true,
    },
  });
  const snapByLogin = new Map<
    string,
    {
      tradeAccountName: string | null;
      sourcePlatform: string | null;
      brokerName: string | null;
      brokerServer: string | null;
    }
  >();
  for (const s of snaps) {
    if (!snapByLogin.has(s.mtLogin)) {
      snapByLogin.set(s.mtLogin, {
        tradeAccountName: s.tradeAccountName,
        sourcePlatform: s.sourcePlatform,
        brokerName: s.brokerName,
        brokerServer: s.brokerServer,
      });
    }
  }

  return mtLogins.map((mtLogin) => {
    const snap = snapByLogin.get(mtLogin);
    const pub = pubMap.get(mtLogin);
    const plat = (pub?.platform ?? snap?.sourcePlatform ?? "mt5").toLowerCase();
    return {
      mtLogin,
      tradeAccountName: snap?.tradeAccountName ?? null,
      ownerWebsiteName,
      sourcePlatform: snap?.sourcePlatform ?? null,
      brokerName: snap?.brokerName ?? null,
      brokerServer: snap?.brokerServer ?? null,
      allowCopy: pub?.allowCopy ?? false,
      allowWatch: pub?.allowWatch ?? false,
      copyFree: pub?.copyFree ?? true,
      copyPriceIdr: pub ? Number(pub.copyPriceIdr) : 0,
      watchAlertFree: pub?.watchAlertFree ?? true,
      watchAlertPriceIdr: pub ? Number(pub.watchAlertPriceIdr) : 0,
      platform: plat === "mt4" ? "mt4" : "mt5",
    };
  });
}

export async function userOwnsMtLogin(userId: string, mtLogin: string): Promise<boolean> {
  const [dc, sc] = await Promise.all([
    prisma.mtDeal.count({ where: { userId, mtLogin } }),
    prisma.mtAccountSnapshot.count({ where: { userId, mtLogin } }),
  ]);
  return dc + sc > 0;
}
