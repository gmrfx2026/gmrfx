import { prisma } from "@/lib/prisma";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";

export type CommunityPublishedAccountView = {
  publisherUserId: string;
  publisherName: string | null;
  publisherSlug: string | null;
  mtLogin: string;
  displayName: string;
  platformLabel: string;
  methodLabel: string;
  modeLabel: string;
  gainLabel: string;
  dailyLabel: string;
  ddLabel: string;
  balanceLabel: string;
  pnlLabel: string;
  currency: string | null;
  copyFree: boolean;
  copyPriceIdr: number;
  alreadyFollowing: boolean;
};

function fmtNum(n: number | null, maxFrac = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("id-ID", { maximumFractionDigits: maxFrac });
}

/** Daftar akun yang boleh di-copy di komunitas + ringkasan angka untuk tabel. */
export async function fetchCommunityPublishedAccounts(
  viewerUserId: string | null
): Promise<CommunityPublishedAccountView[]> {
  const published = await prisma.mtCommunityPublishedAccount.findMany({
    where: {
      allowCopy: true,
      user: { ...listablePublicMemberWhere },
    },
    include: {
      user: { select: { id: true, name: true, memberSlug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  if (published.length === 0) return [];

  const pairs = published.map((p) => ({ userId: p.userId, mtLogin: p.mtLogin }));

  const [snaps, deals, follows] = await Promise.all([
    prisma.mtAccountSnapshot.findMany({
      where: { OR: pairs },
      orderBy: { recordedAt: "desc" },
      select: {
        userId: true,
        mtLogin: true,
        balance: true,
        equity: true,
        tradeAccountName: true,
        brokerServer: true,
        currency: true,
        sourcePlatform: true,
        recordedAt: true,
      },
    }),
    prisma.mtDeal.findMany({
      where: {
        OR: pairs,
        dealType: { in: [0, 1] },
        entryType: { in: [1, 3] },
      },
      select: {
        userId: true,
        mtLogin: true,
        profit: true,
        commission: true,
        swap: true,
      },
    }),
    viewerUserId
      ? prisma.mtCopyFollow.findMany({
          where: { followerUserId: viewerUserId },
          select: { publisherUserId: true, mtLogin: true },
        })
      : Promise.resolve([]),
  ]);

  const snapLatest = new Map<
    string,
    {
      balance: unknown;
      equity: unknown;
      tradeAccountName: string | null;
      brokerServer: string | null;
      currency: string | null;
      sourcePlatform: string | null;
    }
  >();
  for (const s of snaps) {
    const k = `${s.userId}\t${s.mtLogin}`;
    if (!snapLatest.has(k)) {
      snapLatest.set(k, {
        balance: s.balance,
        equity: s.equity,
        tradeAccountName: s.tradeAccountName,
        brokerServer: s.brokerServer,
        currency: s.currency,
        sourcePlatform: s.sourcePlatform,
      });
    }
  }

  const netMap = new Map<string, number>();
  for (const d of deals) {
    const k = `${d.userId}\t${d.mtLogin}`;
    const add = Number(d.profit) + Number(d.commission) + Number(d.swap);
    netMap.set(k, (netMap.get(k) ?? 0) + add);
  }

  const followSet = new Set(follows.map((f) => `${f.publisherUserId}\t${f.mtLogin}`));

  return published.map((row) => {
    const k = `${row.userId}\t${row.mtLogin}`;
    const snap = snapLatest.get(k);
    const netPl = netMap.get(k) ?? 0;
    const bal = snap?.balance != null ? Number(snap.balance) : null;
    const eq = snap?.equity != null ? Number(snap.equity) : null;
    const srv = snap?.brokerServer?.toLowerCase() ?? "";
    const modeLabel = srv.includes("demo") ? "Demo" : "Real";
    const platRaw = (row.platform || snap?.sourcePlatform || "mt5").toLowerCase();
    const platformLabel = platRaw === "mt4" ? "MetaTrader 4" : "MetaTrader 5";
    const nameFromSnap = snap?.tradeAccountName?.trim() ?? "";
    const ownerName = row.user.name?.trim() ?? "";
    const displayName =
      nameFromSnap.length > 0
        ? nameFromSnap
        : ownerName.length > 0
          ? ownerName
          : `Akun ${row.mtLogin}`;

    return {
      publisherUserId: row.userId,
      publisherName: row.user.name,
      publisherSlug: row.user.memberSlug,
      mtLogin: row.mtLogin,
      displayName,
      platformLabel,
      methodLabel: "EA",
      modeLabel,
      gainLabel: "—",
      dailyLabel: "—",
      ddLabel: "—",
      balanceLabel: fmtNum(bal, 2),
      pnlLabel: fmtNum(netPl, 2),
      currency: snap?.currency ?? null,
      copyFree: row.copyFree,
      copyPriceIdr: Number(row.copyPriceIdr),
      alreadyFollowing: followSet.has(k),
    };
  });
}
