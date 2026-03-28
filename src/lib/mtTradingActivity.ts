/** Bentuk baris yang disimpan di `MtTradingActivity` (dari EA + validasi ingest). */

export type MtOpenPositionRow = {
  ticket: string;
  symbol: string;
  side: number;
  volume: number;
  priceOpen: number;
  priceCurrent?: number;
  sl?: number | null;
  tp?: number | null;
  profit: number;
  swap: number;
  commission: number;
  openTime: number;
  points?: number | null;
};

export type MtPendingOrderRow = {
  ticket: string;
  symbol: string;
  orderType: number;
  volume: number;
  priceOrder: number;
  sl?: number | null;
  tp?: number | null;
  setupTime: number;
};

export type TradingActivityView = {
  positions: MtOpenPositionRow[];
  pendingOrders: MtPendingOrderRow[];
  /** ISO — aman dikirim dari Server Component ke client. */
  recordedAt: string;
};

function num(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : 0;
}

function str(x: unknown): string {
  if (x == null) return "";
  return String(x).trim().slice(0, 64);
}

/** Normalisasi JSON dari DB (aman jika bentuk tidak sempurna). */
export function parseTradingActivityFromDb(
  positions: unknown,
  pendingOrders: unknown
): { positions: MtOpenPositionRow[]; pendingOrders: MtPendingOrderRow[] } {
  const p: MtOpenPositionRow[] = [];
  const q: MtPendingOrderRow[] = [];
  if (Array.isArray(positions)) {
    for (const raw of positions) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const ticket = str(o.ticket);
      if (!ticket) continue;
      p.push({
        ticket,
        symbol: str(o.symbol) || "(internal)",
        side: Number.isFinite(Number(o.side)) ? Number(o.side) : 0,
        volume: num(o.volume),
        priceOpen: num(o.priceOpen),
        priceCurrent: o.priceCurrent != null ? num(o.priceCurrent) : undefined,
        sl: o.sl == null ? null : num(o.sl),
        tp: o.tp == null ? null : num(o.tp),
        profit: num(o.profit),
        swap: num(o.swap),
        commission: num(o.commission),
        openTime: Math.trunc(num(o.openTime)),
        points: o.points == null || o.points === "" ? null : num(o.points),
      });
    }
  }
  if (Array.isArray(pendingOrders)) {
    for (const raw of pendingOrders) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const ticket = str(o.ticket);
      if (!ticket) continue;
      q.push({
        ticket,
        symbol: str(o.symbol) || "(internal)",
        orderType: Number.isFinite(Number(o.orderType)) ? Number(o.orderType) : 0,
        volume: num(o.volume),
        priceOrder: num(o.priceOrder),
        sl: o.sl == null ? null : num(o.sl),
        tp: o.tp == null ? null : num(o.tp),
        setupTime: Math.trunc(num(o.setupTime)),
      });
    }
  }
  return { positions: p, pendingOrders: q };
}

export function tradingActivityFromRow(row: {
  positions: unknown;
  pendingOrders: unknown;
  recordedAt: Date;
} | null): TradingActivityView | null {
  if (!row) return null;
  const { positions, pendingOrders } = parseTradingActivityFromDb(row.positions, row.pendingOrders);
  return { positions, pendingOrders, recordedAt: row.recordedAt.toISOString() };
}

export function mtPendingOrderTypeLabel(orderType: number): string {
  const m: Record<number, string> = {
    2: "Buy limit",
    3: "Sell limit",
    4: "Buy stop",
    5: "Sell stop",
    6: "Buy stop limit",
    7: "Sell stop limit",
  };
  return m[orderType] ?? `Tipe ${orderType}`;
}
