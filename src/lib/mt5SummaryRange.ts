import { dealNet, isClosingDeal } from "@/lib/mt5Stats";
import { jakartaDayKey, jakartaTodayParts, daysInMonth, JOURNAL_TIMEZONE } from "@/lib/mt5Journal";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Inklusif: awal hari from (WIB) → akhir hari to (WIB). */
export function jakartaRangeUtcBounds(fromKey: string, toKey: string): { start: Date; end: Date } | null {
  if (!DAY_KEY.test(fromKey) || !DAY_KEY.test(toKey)) return null;
  let a = fromKey;
  let b = toKey;
  if (a > b) [a, b] = [b, a];
  const start = new Date(`${a}T00:00:00+07:00`);
  const end = new Date(`${b}T23:59:59.999+07:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

/** Default & preset: bulan berjalan WIB → hari ini. */
export function presetThisMonth(): { from: string; to: string } {
  const { y, m, dayKey } = jakartaTodayParts();
  return { from: `${y}-${pad2(m)}-01`, to: dayKey };
}

export function presetLastMonth(): { from: string; to: string } {
  const { y, m } = jakartaTodayParts();
  const pm = m <= 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const dim = daysInMonth(pm.y, pm.m);
  return {
    from: `${pm.y}-${pad2(pm.m)}-01`,
    to: `${pm.y}-${pad2(pm.m)}-${pad2(dim)}`,
  };
}

export function presetLast30Days(): { from: string; to: string } {
  const to = jakartaDayKey(new Date());
  const from = jakartaDayKey(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  return { from, to };
}

export function presetThisYear(): { from: string; to: string } {
  const { y, dayKey } = jakartaTodayParts();
  return { from: `${y}-01-01`, to: dayKey };
}

export type RangeSummaryMetrics = {
  netPl: number;
  closedTrades: number;
  longs: number;
  shorts: number;
  wins: number;
  losses: number;
  winRatePct: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
  grossProfit: number;
  grossLossAbs: number;
};

export function computeRangeSummary(
  deals: Array<{
    dealType: number;
    entryType: number;
    profit: unknown;
    commission: unknown;
    swap: unknown;
  }>
): RangeSummaryMetrics {
  const closing = deals.filter(isClosingDeal);
  const nets = closing.map((d) => dealNet(d));

  let longs = 0;
  let shorts = 0;
  let wins = 0;
  let losses = 0;
  let grossProfit = 0;
  let grossLossAbs = 0;

  for (const d of closing) {
    if (d.dealType === 0) longs++;
    if (d.dealType === 1) shorts++;
  }

  for (const x of nets) {
    if (x > 0) {
      wins++;
      grossProfit += x;
    } else if (x < 0) {
      losses++;
      grossLossAbs += -x;
    }
  }

  const wrDenom = wins + losses;
  const winRatePct = wrDenom > 0 ? (100 * wins) / wrDenom : null;
  const profitFactor =
    grossLossAbs > 0 ? grossProfit / grossLossAbs : grossProfit > 0 ? null : null;

  const netPl = nets.reduce((a, b) => a + b, 0);
  const closedTrades = closing.length;
  const expectancy = closedTrades > 0 ? netPl / closedTrades : null;
  const bestTrade = nets.length ? Math.max(...nets) : null;
  const worstTrade = nets.length ? Math.min(...nets) : null;

  return {
    netPl,
    closedTrades,
    longs,
    shorts,
    wins,
    losses,
    winRatePct,
    profitFactor,
    expectancy,
    bestTrade,
    worstTrade,
    grossProfit,
    grossLossAbs,
  };
}

export function formatSummaryRangeLabel(fromKey: string, toKey: string): string {
  const fmt = (k: string) => {
    const [y, m, d] = k.split("-");
    if (!y || !m || !d) return k;
    return `${d}.${m}.${y}`;
  };
  return `${fmt(fromKey)} – ${fmt(toKey)} (${JOURNAL_TIMEZONE})`;
}
