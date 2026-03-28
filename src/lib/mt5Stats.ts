/**
 * Agregasi statistik portofolio dari histori MT5 (MtDeal + MtAccountSnapshot).
 * Penutupan posisi = deal buy/sell dengan entry OUT (1) atau OUT_BY (3).
 * Tanpa DEAL_POSITION_ID, metrik durasi trade per posisi tidak tersedia.
 */

export type MtDealRow = {
  dealTime: Date;
  symbol: string;
  dealType: number;
  entryType: number;
  volume: unknown;
  price: unknown;
  commission: unknown;
  swap: unknown;
  profit: unknown;
};

export type MtSnapshotRow = {
  recordedAt: Date;
  balance: unknown;
  equity: unknown;
  currency?: unknown;
  brokerName?: unknown;
  brokerServer?: unknown;
};

function num(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function dealNet(d: { profit: unknown; commission: unknown; swap: unknown }): number {
  return num(d.profit) + num(d.commission) + num(d.swap);
}

export function isBuySell(d: { dealType: number }): boolean {
  return d.dealType === 0 || d.dealType === 1;
}

/** Deal penutupan / partial close. */
export function isClosingDeal(d: { dealType: number; entryType: number }): boolean {
  return isBuySell(d) && (d.entryType === 1 || d.entryType === 3);
}

function utcDayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startUtcWeekMonday(d: Date): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const t = startUtcDay(d);
  t.setUTCDate(t.getUTCDate() - diff);
  return t;
}

function startUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startUtcYear(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function winRateFromNets(nets: number[]): number | null {
  let wins = 0;
  let losses = 0;
  for (const x of nets) {
    if (x > 0) wins++;
    else if (x < 0) losses++;
  }
  const d = wins + losses;
  return d > 0 ? (100 * wins) / d : null;
}

function profitFactorFromNets(nets: number[]): number | null {
  let gp = 0;
  let gl = 0;
  for (const x of nets) {
    if (x > 0) gp += x;
    else if (x < 0) gl += x;
  }
  if (gl === 0) return gp > 0 ? null : null;
  return gp / Math.abs(gl);
}

function snapshotBeforeOrFirst(snaps: MtSnapshotRow[], t: Date): MtSnapshotRow | null {
  const before = snaps.filter((s) => s.recordedAt < t);
  if (before.length) return before[before.length - 1]!;
  return snaps[0] ?? null;
}

function gainPctFromSnapshots(snaps: MtSnapshotRow[], start: Date, end: Date): number | null {
  const a = snapshotBeforeOrFirst(snaps, start);
  const b = snaps.filter((s) => s.recordedAt <= end).pop() ?? null;
  if (!a || !b) return null;
  const startBal = num(a.balance);
  if (startBal === 0) return null;
  const endBal = num(b.balance);
  return ((endBal - startBal) / Math.abs(startBal)) * 100;
}

export type ChartPoint = { date: string; value: number };
export type BalancePoint = { date: string; balance: number; equity: number };

export type PeriodStatsRow = {
  key: string;
  label: string;
  profit: number;
  trades: number;
  lots: number;
  winRatePct: number | null;
  gainPct: number | null;
};

export type SymbolAggRow = {
  symbol: string;
  trades: number;
  net: number;
  lots: number;
};

export type PortfolioStatsModel = {
  mtLogin: string;
  /** Kode mata uang deposit akun MT dari snapshot terakhir yang punya nilai (mis. USD, IDR). */
  accountCurrency: string | null;
  /** Nama broker (ACCOUNT_COMPANY) dari snapshot terakhir yang punya nilai. */
  brokerName: string | null;
  /** Server trading (ACCOUNT_SERVER) dari snapshot terakhir yang punya nilai. */
  brokerServer: string | null;
  summary: {
    balance: number | null;
    equity: number | null;
    netPl: number;
    winRatePct: number | null;
    profitFactor: number | null;
    closedTrades: number;
  };
  sidebar: {
    riskScore: string;
    absGainPct: number | null;
    dailyPct: number | null;
    weeklyPct: number | null;
    monthlyPct: number | null;
    balanceDdPct: number | null;
    equityDdPct: number | null;
    maxBalDdPct: number | null;
    maxEqDdPct: number | null;
    profit: number;
    commission: number;
    swap: number;
    deposits: number;
    withdrawals: number;
    lastUpdate: string | null;
    noteTz: string;
  };
  periodRows: PeriodStatsRow[];
  chart: {
    growth: ChartPoint[];
    balance: BalancePoint[];
    profitDay: ChartPoint[];
    drawdownPct: ChartPoint[];
  };
  trading: {
    totalTrades: number;
    totalLots: number;
    totalPips: null;
    commission: number;
    swap: number;
    activity: string;
    winRatePct: number | null;
    longestTrade: string;
    shortestTrade: string;
    avgTrade: string;
    longsWon: string;
    shortsWon: string;
    expectancy: number | null;
    profitFactor: number | null;
    avgWin: number | null;
    avgLoss: number | null;
    bestTrade: number | null;
    worstTrade: number | null;
  };
  symbols: SymbolAggRow[];
  yearly: { year: string; net: number; trades: number }[];
  dailyAnalysis: { label: string; net: number; trades: number }[];
  hourlyAnalysis: { hour: number; label: string; net: number; trades: number }[];
};

const DOW_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) {
    out.push(arr[Math.min(arr.length - 1, Math.floor(i * step))]!);
  }
  return out;
}

export function buildPortfolioStatsModel(
  deals: MtDealRow[],
  snaps: MtSnapshotRow[],
  mtLogin: string,
  now: Date = new Date()
): PortfolioStatsModel {
  const sortedDeals = [...deals].sort((a, b) => a.dealTime.getTime() - b.dealTime.getTime());
  const sortedSnaps = [...snaps].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  let accountCurrency: string | null = null;
  let brokerName: string | null = null;
  let brokerServer: string | null = null;
  for (let i = sortedSnaps.length - 1; i >= 0; i--) {
    const s = sortedSnaps[i];
    if (!s) continue;
    if (accountCurrency === null) {
      const raw = s.currency;
      if (typeof raw === "string" && raw.trim()) accountCurrency = raw.trim().toUpperCase();
    }
    if (brokerName === null) {
      const raw = s.brokerName;
      if (typeof raw === "string" && raw.trim()) brokerName = raw.trim();
    }
    if (brokerServer === null) {
      const raw = s.brokerServer;
      if (typeof raw === "string" && raw.trim()) brokerServer = raw.trim();
    }
    if (accountCurrency !== null && brokerName !== null && brokerServer !== null) break;
  }

  const closing = sortedDeals.filter(isClosingDeal);
  const closingNets = closing.map(dealNet);
  const netPl = closingNets.reduce((a, b) => a + b, 0);
  const winRatePct = winRateFromNets(closingNets);
  const profitFactor = profitFactorFromNets(closingNets);

  const lastSnap = sortedSnaps[sortedSnaps.length - 1] ?? null;
  const balance = lastSnap ? num(lastSnap.balance) : null;
  const equity = lastSnap ? num(lastSnap.equity) : null;

  const buySell = sortedDeals.filter(isBuySell);
  const commissionSum = buySell.reduce((s, d) => s + num(d.commission), 0);
  const swapSum = buySell.reduce((s, d) => s + num(d.swap), 0);

  const balanceDeals = sortedDeals.filter((d) => d.dealType === 2);
  let deposits = 0;
  let withdrawals = 0;
  for (const d of balanceDeals) {
    const v = dealNet(d);
    if (v > 0) deposits += v;
    else if (v < 0) withdrawals += v;
  }
  withdrawals = Math.abs(withdrawals);

  const firstSnap = sortedSnaps[0] ?? null;
  const absGainPct =
    firstSnap && lastSnap && num(firstSnap.balance) !== 0
      ? ((num(lastSnap.balance) - num(firstSnap.balance)) / Math.abs(num(firstSnap.balance))) * 100
      : null;

  const todayStart = startUtcDay(now);
  const weekStart = startUtcWeekMonday(now);
  const monthStart = startUtcMonth(now);
  const yearStart = startUtcYear(now);

  const todayNets = closing.filter((d) => d.dealTime >= todayStart).map(dealNet);
  const todayNet = todayNets.reduce((a, b) => a + b, 0);
  const yestSnap = snapshotBeforeOrFirst(sortedSnaps, todayStart);
  const dailyPct =
    yestSnap && num(yestSnap.balance) !== 0 ? (todayNet / Math.abs(num(yestSnap.balance))) * 100 : null;

  const weeklyPct = gainPctFromSnapshots(sortedSnaps, weekStart, now);
  const monthlyPct = gainPctFromSnapshots(sortedSnaps, monthStart, now);

  const eqSeries = sortedSnaps.map((s) => num(s.equity));
  const balSeries = sortedSnaps.map((s) => num(s.balance));

  function maxDdPct(series: number[]): number | null {
    if (series.length < 2) return null;
    let peak = series[0]!;
    let maxDd = 0;
    for (const v of series) {
      if (v > peak) peak = v;
      if (peak > 0) {
        const dd = ((peak - v) / peak) * 100;
        if (dd > maxDd) maxDd = dd;
      }
    }
    return maxDd;
  }

  const maxEqDdPct = maxDdPct(eqSeries);
  const maxBalDdPct = maxDdPct(balSeries);
  const balanceDdPct =
    balSeries.length >= 2 && balSeries[balSeries.length - 1] != null
      ? ((Math.max(...balSeries) - balSeries[balSeries.length - 1]!) / Math.max(...balSeries)) * 100
      : null;
  const equityDdPct =
    eqSeries.length >= 2 && eqSeries[eqSeries.length - 1] != null
      ? ((Math.max(...eqSeries) - eqSeries[eqSeries.length - 1]!) / Math.max(...eqSeries)) * 100
      : null;

  function periodRow(key: string, label: string, start: Date): PeriodStatsRow {
    const slice = closing.filter((d) => d.dealTime >= start && d.dealTime <= now);
    const nets = slice.map(dealNet);
    const profit = nets.reduce((a, b) => a + b, 0);
    const trades = slice.length;
    const lots = slice.reduce((s, d) => s + num(d.volume), 0);
    return {
      key,
      label,
      profit,
      trades,
      lots,
      winRatePct: winRateFromNets(nets),
      gainPct: gainPctFromSnapshots(sortedSnaps, start, now),
    };
  }

  const periodRows: PeriodStatsRow[] = [
    periodRow("today", "Hari ini", todayStart),
    periodRow("week", "Minggu ini", weekStart),
    periodRow("month", "Bulan ini", monthStart),
    periodRow("year", "Tahun ini", yearStart),
  ];

  const dailyNetMap = new Map<string, number>();
  for (const d of buySell) {
    const k = utcDayKey(d.dealTime);
    dailyNetMap.set(k, (dailyNetMap.get(k) ?? 0) + dealNet(d));
  }
  const sortedDays = Array.from(dailyNetMap.keys()).sort();
  let cum = 0;
  const growthRaw: ChartPoint[] = [];
  const profitDayRaw: ChartPoint[] = [];
  const drawdownRaw: ChartPoint[] = [];
  let peakCum = 0;
  for (const day of sortedDays) {
    const dayP = dailyNetMap.get(day) ?? 0;
    cum += dayP;
    growthRaw.push({ date: day, value: cum });
    profitDayRaw.push({ date: day, value: dayP });
    if (cum > peakCum) peakCum = cum;
    const dd = peakCum > 0 ? ((peakCum - cum) / Math.abs(peakCum)) * 100 : 0;
    drawdownRaw.push({ date: day, value: dd });
  }

  const balanceChart: BalancePoint[] = sortedSnaps.map((s) => ({
    date: s.recordedAt.toISOString().slice(0, 10),
    balance: num(s.balance),
    equity: num(s.equity),
  }));

  const uniqueDays = new Set(sortedDeals.map((d) => utcDayKey(d.dealTime)));
  const activity =
    uniqueDays.size > 0 ? `${(closing.length / uniqueDays.size).toFixed(1)} trade/hari aktif` : "—";

  let winsL = 0;
  let lossesL = 0;
  let winsS = 0;
  let lossesS = 0;
  for (const d of closing) {
    const net = dealNet(d);
    if (d.dealType === 0) {
      if (net > 0) winsL++;
      else if (net < 0) lossesL++;
    } else if (d.dealType === 1) {
      if (net > 0) winsS++;
      else if (net < 0) lossesS++;
    }
  }
  const longsWon =
    winsL + lossesL > 0 ? `${winsL} / ${winsL + lossesL} (${((100 * winsL) / (winsL + lossesL)).toFixed(1)}%)` : "—";
  const shortsWon =
    winsS + lossesS > 0 ? `${winsS} / ${winsS + lossesS} (${((100 * winsS) / (winsS + lossesS)).toFixed(1)}%)` : "—";

  const posNets = closingNets.filter((x) => x > 0);
  const negNets = closingNets.filter((x) => x < 0);
  const avgWin = posNets.length ? posNets.reduce((a, b) => a + b, 0) / posNets.length : null;
  const avgLoss = negNets.length ? negNets.reduce((a, b) => a + b, 0) / negNets.length : null;
  const bestTrade = closingNets.length ? Math.max(...closingNets) : null;
  const worstTrade = closingNets.length ? Math.min(...closingNets) : null;
  const expectancy = closingNets.length ? netPl / closingNets.length : null;

  const symMap = new Map<string, { trades: number; net: number; lots: number }>();
  for (const d of closing) {
    const sym = d.symbol.trim() || "(internal)";
    const cur = symMap.get(sym) ?? { trades: 0, net: 0, lots: 0 };
    cur.trades += 1;
    cur.net += dealNet(d);
    cur.lots += num(d.volume);
    symMap.set(sym, cur);
  }
  const symbols: SymbolAggRow[] = Array.from(symMap.entries())
    .map(([symbol, v]) => ({ symbol, ...v }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  const yearMap = new Map<string, { net: number; trades: number }>();
  for (const d of closing) {
    const y = String(d.dealTime.getUTCFullYear());
    const cur = yearMap.get(y) ?? { net: 0, trades: 0 };
    cur.net += dealNet(d);
    cur.trades += 1;
    yearMap.set(y, cur);
  }
  const yearly = Array.from(yearMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, v]) => ({ year, ...v }));

  const dowMap = new Map<number, { net: number; trades: number }>();
  for (const d of closing) {
    const dow = d.dealTime.getUTCDay();
    const cur = dowMap.get(dow) ?? { net: 0, trades: 0 };
    cur.net += dealNet(d);
    cur.trades += 1;
    dowMap.set(dow, cur);
  }
  const dailyAnalysis = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const cur = dowMap.get(dow) ?? { net: 0, trades: 0 };
    return { label: DOW_ID[dow] ?? String(dow), net: cur.net, trades: cur.trades };
  });

  const hourMap = new Map<number, { net: number; trades: number }>();
  for (const d of closing) {
    const h = d.dealTime.getUTCHours();
    const cur = hourMap.get(h) ?? { net: 0, trades: 0 };
    cur.net += dealNet(d);
    cur.trades += 1;
    hourMap.set(h, cur);
  }
  const hourlyAnalysis = Array.from({ length: 24 }, (_, hour) => {
    const cur = hourMap.get(hour) ?? { net: 0, trades: 0 };
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00 UTC`,
      net: cur.net,
      trades: cur.trades,
    };
  });

  return {
    mtLogin,
    accountCurrency,
    brokerName,
    brokerServer,
    summary: {
      balance,
      equity,
      netPl,
      winRatePct,
      profitFactor,
      closedTrades: closing.length,
    },
    sidebar: {
      riskScore: "N/A",
      absGainPct,
      dailyPct,
      weeklyPct,
      monthlyPct,
      balanceDdPct,
      equityDdPct,
      maxBalDdPct,
      maxEqDdPct,
      profit: netPl,
      commission: commissionSum,
      swap: swapSum,
      deposits,
      withdrawals,
      lastUpdate: lastSnap ? lastSnap.recordedAt.toISOString() : null,
      noteTz: "Agregasi periode & grafik harian memakai tanggal UTC.",
    },
    periodRows,
    chart: {
      growth: downsample(growthRaw, 400),
      balance: downsample(balanceChart, 400),
      profitDay: downsample(profitDayRaw, 400),
      drawdownPct: downsample(drawdownRaw, 400),
    },
    trading: {
      totalTrades: closing.length,
      totalLots: closing.reduce((s, d) => s + num(d.volume), 0),
      totalPips: null,
      commission: commissionSum,
      swap: swapSum,
      activity,
      winRatePct,
      longestTrade: "—",
      shortestTrade: "—",
      avgTrade: closing.length ? (netPl / closing.length).toFixed(2) : "—",
      longsWon,
      shortsWon,
      expectancy,
      profitFactor,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
    },
    symbols,
    yearly,
    dailyAnalysis,
    hourlyAnalysis,
  };
}
