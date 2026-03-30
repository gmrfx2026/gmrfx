import { prisma } from "@/lib/prisma";
import { activeCommunitySubscriptionWhere } from "@/lib/communitySubscription";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";
import {
  buildPortfolioStatsModel,
  type MtDealRow,
  type MtSnapshotRow,
  type PortfolioStatsModel,
} from "@/lib/mt5Stats";

export type MetricTone = "up" | "down" | "flat" | "none";

export type CommunityPublishedAccountView = {
  publisherUserId: string;
  publisherName: string | null;
  publisherSlug: string | null;
  mtLogin: string;
  displayName: string;
  platformLabel: string;
  methodLabel: string;
  modeLabel: string;
  scoreLabel: string;
  gainLabel: string;
  dailyLabel: string;
  ddBalLabel: string;
  ddEqLabel: string;
  balanceLabel: string;
  pnlLabel: string;
  activityLabel: string;
  currency: string | null;
  copyFree: boolean;
  copyPriceIdr: number;
  /** Harga sekali daftar alert Ikuti (jika tidak gratis). */
  watchAlertFree: boolean;
  watchAlertPriceIdr: number;
  allowCopy: boolean;
  allowWatch: boolean;
  alreadyFollowing: boolean;
  /** Mengikuti alert buka/tutup posisi (tombol Ikuti). */
  activityWatching: boolean;
  gainTone: MetricTone;
  dailyTone: MetricTone;
  pnlTone: MetricTone;
};

const DEFAULT_PAGE_SIZE = 12;

function fmtNum(n: number | null, maxFrac = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("id-ID", { maximumFractionDigits: maxFrac });
}

function fmtPctSigned(n: number | null, maxFrac = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("id-ID", { maximumFractionDigits: maxFrac })}%`;
}

function pctTone(n: number | null): MetricTone {
  if (n == null || !Number.isFinite(n)) return "none";
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "flat";
}

function plTone(n: number): MetricTone {
  if (!Number.isFinite(n)) return "none";
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "flat";
}

/** Skor 0–100 ringkas (bukan “FXer Score”): win rate + drawdown equity terkendali. */
function communityScoreFromModel(model: PortfolioStatsModel): number | null {
  const wr = model.summary.winRatePct;
  const dd = model.sidebar.maxEqDdPct;
  if (model.summary.closedTrades === 0 && (wr == null || dd == null)) return null;
  let s = 0;
  if (wr != null && Number.isFinite(wr)) s += wr * 0.55;
  if (dd != null && Number.isFinite(dd)) {
    s += Math.max(0, 45 - Math.min(dd, 45));
  } else if (wr != null) {
    s += 20;
  }
  return Math.round(Math.min(100, Math.max(0, s)));
}

export type CommunityAccountsPageResult = {
  rows: CommunityPublishedAccountView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Daftar akun komunitas + metrik (alur mirip dashboard per akun), dengan paginasi. */
export async function fetchCommunityPublishedAccounts(
  viewerUserId: string | null,
  opts?: { page?: number; pageSize?: number }
): Promise<CommunityAccountsPageResult> {
  const pageSize = Math.min(50, Math.max(1, opts?.pageSize ?? DEFAULT_PAGE_SIZE));
  const page = Math.max(1, opts?.page ?? 1);
  const skip = (page - 1) * pageSize;

  const wherePub = {
    allowCopy: true,
    user: { ...listablePublicMemberWhere },
  } as const;

  const [total, published] = await Promise.all([
    prisma.mtCommunityPublishedAccount.count({ where: wherePub }),
    prisma.mtCommunityPublishedAccount.findMany({
      where: wherePub,
      include: {
        user: { select: { id: true, name: true, memberSlug: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (published.length === 0) {
    return { rows: [], total, page, pageSize, totalPages: total === 0 ? 1 : totalPages };
  }

  const pairs = published.map((p) => ({ userId: p.userId, mtLogin: p.mtLogin }));

  const [allSnaps, allDeals, follows, activityWatches] = await Promise.all([
    prisma.mtAccountSnapshot.findMany({
      where: { OR: pairs },
      orderBy: { recordedAt: "asc" },
      select: {
        userId: true,
        mtLogin: true,
        recordedAt: true,
        balance: true,
        equity: true,
        currency: true,
        sourcePlatform: true,
        tradeAccountName: true,
        brokerServer: true,
        brokerName: true,
      },
    }),
    prisma.mtDeal.findMany({
      where: { OR: pairs },
      select: {
        userId: true,
        mtLogin: true,
        dealTime: true,
        symbol: true,
        dealType: true,
        entryType: true,
        volume: true,
        price: true,
        commission: true,
        swap: true,
        profit: true,
      },
    }),
    viewerUserId
      ? prisma.mtCopyFollow.findMany({
          where: { followerUserId: viewerUserId, ...activeCommunitySubscriptionWhere() },
          select: { publisherUserId: true, mtLogin: true },
        })
      : Promise.resolve([]),
    viewerUserId
      ? prisma.mtCommunityActivityWatch.findMany({
          where: { followerUserId: viewerUserId, ...activeCommunitySubscriptionWhere() },
          select: { publisherUserId: true, mtLogin: true },
        })
      : Promise.resolve([]),
  ]);

  const snapsByKey = new Map<string, (typeof allSnaps)[number][]>();
  for (const s of allSnaps) {
    const k = `${s.userId}\t${s.mtLogin}`;
    const arr = snapsByKey.get(k) ?? [];
    arr.push(s);
    snapsByKey.set(k, arr);
  }

  const dealsByKey = new Map<string, MtDealRow[]>();
  for (const d of allDeals) {
    const k = `${d.userId}\t${d.mtLogin}`;
    const arr = dealsByKey.get(k) ?? [];
    arr.push({
      dealTime: d.dealTime,
      symbol: d.symbol,
      dealType: d.dealType,
      entryType: d.entryType,
      volume: d.volume,
      price: d.price,
      commission: d.commission,
      swap: d.swap,
      profit: d.profit,
    });
    dealsByKey.set(k, arr);
  }

  const followSet = new Set(follows.map((f) => `${f.publisherUserId}\t${f.mtLogin}`));
  const watchSet = new Set(activityWatches.map((w) => `${w.publisherUserId}\t${w.mtLogin}`));

  const now = new Date();
  const rows: CommunityPublishedAccountView[] = published.map((row) => {
    const k = `${row.userId}\t${row.mtLogin}`;
    const snapArr = snapsByKey.get(k) ?? [];
    const lastSnap = snapArr.length > 0 ? snapArr[snapArr.length - 1]! : null;

    const snapRowsForModel: MtSnapshotRow[] = snapArr.map((s) => ({
      recordedAt: s.recordedAt,
      balance: s.balance,
      equity: s.equity,
      currency: s.currency ?? undefined,
      brokerName: s.brokerName ?? undefined,
      brokerServer: s.brokerServer ?? undefined,
      tradeAccountName: s.tradeAccountName ?? undefined,
    }));

    const model = buildPortfolioStatsModel(dealsByKey.get(k) ?? [], snapRowsForModel, row.mtLogin, now);

    const srv = lastSnap?.brokerServer?.toLowerCase() ?? "";
    const modeLabel = srv.includes("demo") ? "Demo" : "Real";
    const platRaw = (row.platform || lastSnap?.sourcePlatform || "mt5").toLowerCase();
    const platformLabel = platRaw === "mt4" ? "MetaTrader 4" : "MetaTrader 5";

    const nameFromSnap = lastSnap?.tradeAccountName?.trim() ?? "";
    const ownerName = row.user.name?.trim() ?? "";
    const displayName =
      nameFromSnap.length > 0
        ? nameFromSnap
        : ownerName.length > 0
          ? ownerName
          : `Akun ${row.mtLogin}`;

    const absGain = model.sidebar.absGainPct;
    const daily = model.sidebar.dailyPct;
    const netPl = model.summary.netPl;

    const scoreN = communityScoreFromModel(model);

    return {
      publisherUserId: row.userId,
      publisherName: row.user.name,
      publisherSlug: row.user.memberSlug,
      mtLogin: row.mtLogin,
      displayName,
      platformLabel,
      methodLabel: "Otomatis",
      modeLabel,
      scoreLabel: scoreN == null ? "—" : String(scoreN),
      gainLabel: fmtPctSigned(absGain),
      dailyLabel: fmtPctSigned(daily),
      ddBalLabel: fmtPctSigned(model.sidebar.maxBalDdPct),
      ddEqLabel: fmtPctSigned(model.sidebar.maxEqDdPct),
      balanceLabel: fmtNum(model.summary.balance, 2),
      pnlLabel: fmtNum(netPl, 2),
      activityLabel: model.trading.activity,
      currency: lastSnap?.currency ?? null,
      copyFree: row.copyFree,
      copyPriceIdr: Number(row.copyPriceIdr),
      watchAlertFree: row.watchAlertFree,
      watchAlertPriceIdr: Number(row.watchAlertPriceIdr),
      allowCopy: row.allowCopy,
      allowWatch: row.allowWatch,
      alreadyFollowing: followSet.has(k),
      activityWatching: watchSet.has(k),
      gainTone: pctTone(absGain),
      dailyTone: pctTone(daily),
      pnlTone: plTone(netPl),
    };
  });

  return { rows, total, page, pageSize, totalPages };
}
