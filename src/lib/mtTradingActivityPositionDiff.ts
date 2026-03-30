import type { MtOpenPositionRow } from "@/lib/mtTradingActivity";

export type PositionOpenAlert = { ticket: string; symbol: string; sl: number | null; tp: number | null };
export type PositionCloseAlert = { ticket: string; symbol: string };
export type PositionSltpChangeAlert = {
  ticket: string;
  symbol: string;
  sl: number | null;
  tp: number | null;
  wasSl: number | null;
  wasTp: number | null;
};

export type IngestOpenPositionLite = {
  ticket: string;
  symbol: string;
  sl?: number | null;
  tp?: number | null;
};

function normalizeSltp(sl?: number | null, tp?: number | null): { sl: number | null; tp: number | null } {
  return {
    sl: sl != null && Number.isFinite(sl) ? sl : null,
    tp: tp != null && Number.isFinite(tp) ? tp : null,
  };
}

/** Bandingkan level SL/TP (null = tidak set); toleransi float ringan. */
export function mtSltpLevelEqual(a: number | null, b: number | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) < 1e-8 * scale;
}

/**
 * Diff untuk alert komunitas: buka, tutup, dan perubahan SL/TP pada ticket yang sama.
 */
export function diffOpenPositionsForAlerts(
  previous: MtOpenPositionRow[],
  next: IngestOpenPositionLite[]
): {
  opened: PositionOpenAlert[];
  closed: PositionCloseAlert[];
  sltpChanged: PositionSltpChangeAlert[];
} {
  const prevByTicket = new Map(previous.map((p) => [p.ticket, p]));
  const nextByTicket = new Map(
    next.map((p) => {
      const { sl, tp } = normalizeSltp(p.sl, p.tp);
      return [p.ticket, { ticket: p.ticket, symbol: p.symbol, sl, tp }] as const;
    })
  );

  const opened: PositionOpenAlert[] = [];
  const closed: PositionCloseAlert[] = [];
  const sltpChanged: PositionSltpChangeAlert[] = [];

  nextByTicket.forEach((np, ticket) => {
    const op = prevByTicket.get(ticket);
    if (!op) {
      opened.push({ ticket, symbol: np.symbol, sl: np.sl, tp: np.tp });
    } else {
      const oSl = op.sl ?? null;
      const oTp = op.tp ?? null;
      if (!mtSltpLevelEqual(oSl, np.sl) || !mtSltpLevelEqual(oTp, np.tp)) {
        sltpChanged.push({
          ticket,
          symbol: np.symbol,
          sl: np.sl,
          tp: np.tp,
          wasSl: oSl,
          wasTp: oTp,
        });
      }
    }
  });

  prevByTicket.forEach((op, ticket) => {
    if (!nextByTicket.has(ticket)) {
      closed.push({ ticket, symbol: op.symbol });
    }
  });

  return { opened, closed, sltpChanged };
}
