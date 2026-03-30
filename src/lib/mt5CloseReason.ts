import { prisma } from "@/lib/prisma";

/** MT5 DEAL_ENTRY */
export const DEAL_ENTRY_OUT = 1;
export const DEAL_ENTRY_OUT_BY = 3;

/** MT5 ENUM_DEAL_REASON — nilai int dari HistoryDealGetInteger(DEAL_REASON) */
export const DEAL_REASON_SL = 4;
export const DEAL_REASON_TP = 5;
export const DEAL_REASON_SO = 6;
export const DEAL_REASON_ROLLOVER = 7;
export const DEAL_REASON_VMARGIN = 8;
export const DEAL_REASON_SPLIT = 9;
export const DEAL_REASON_CORPORATE_ACTION = 10;

/**
 * SL+ = penutupan karena SL tetapi deal menunjuk profit > 0 (trailing SL / break-even di zona untung).
 * MT5 tidak punya reason terpisah; kita turunkan dari DEAL_REASON_SL + profit penutupan.
 */
export type Mt5CloseKind =
  | "tp"
  | "sl"
  | "sl_profit"
  | "stop_out"
  | "vmargin"
  | "rollover"
  | "split"
  | "corporate"
  | "manual"
  | "unknown";

function numProfit(p: number | null | undefined): number | null {
  if (p == null || !Number.isFinite(p)) return null;
  return p;
}

export function closeKindFromDealReason(
  reason: number | null | undefined,
  closingProfit?: number | null
): Mt5CloseKind {
  if (reason == null) return "unknown";
  const p = numProfit(closingProfit);

  if (reason === DEAL_REASON_TP) return "tp";
  if (reason === DEAL_REASON_SL) {
    if (p != null && p > 1e-8) return "sl_profit";
    return "sl";
  }
  if (reason === DEAL_REASON_SO) return "stop_out";
  if (reason === DEAL_REASON_VMARGIN) return "vmargin";
  if (reason === DEAL_REASON_ROLLOVER) return "rollover";
  if (reason === DEAL_REASON_SPLIT) return "split";
  if (reason === DEAL_REASON_CORPORATE_ACTION) return "corporate";
  return "manual";
}

export function closeKindLabelId(kind: Mt5CloseKind): string {
  switch (kind) {
    case "tp":
      return "terkena Take Profit";
    case "sl_profit":
      return "terkena Stop Loss+ (tutup dalam profit / trailing SL)";
    case "sl":
      return "terkena Stop Loss";
    case "stop_out":
      return "Stop out / margin";
    case "vmargin":
      return "Break event / variasi margin (VMargin)";
    case "rollover":
      return "Penutupan rollover";
    case "split":
      return "Split instrumen";
    case "corporate":
      return "Aksi korporasi";
    case "manual":
      return "manual / EA / broker";
    default:
      return "ditutup (alasan tidak tersedia)";
  }
}

export type DealRowForCloseResolve = {
  dealTime: number;
  entryType: number;
  positionId: string | null;
  dealReason?: number | null;
  /** Profit deal penutupan (account currency); untuk membedakan SL vs SL+. */
  profit?: number | null;
  /** DEAL_COMMENT dari terminal (alasan/komentar saat tutup). */
  comment?: string | null;
  /** Symbol deal (fallback jika ticket posisi ≠ DEAL_POSITION_ID). */
  symbol?: string | null;
};

function normSym(s: string): string {
  return String(s).trim().toLowerCase();
}

function isFiniteDealReason(r: unknown): r is number {
  return typeof r === "number" && Number.isFinite(r);
}

const MAX_DEAL_COMMENT_IN_ALERT = 220;

/** Teks komentar deal untuk notifikasi (aman & pendek). */
export function sanitizeDealCommentForAlert(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/\s+/g, " ");
  s = s.replace(/[\u0000-\u001F\u007F]/g, "");
  if (!s) return null;
  if (s.length > MAX_DEAL_COMMENT_IN_ALERT) s = `${s.slice(0, MAX_DEAL_COMMENT_IN_ALERT)}…`;
  return s;
}

function isExitEntry(entryType: number): boolean {
  return entryType === DEAL_ENTRY_OUT || entryType === DEAL_ENTRY_OUT_BY;
}

function latestExitForPosition(
  positionTicket: string,
  deals: DealRowForCloseResolve[]
): DealRowForCloseResolve | null {
  const t = String(positionTicket).trim();
  const matches = deals.filter(
    (d) =>
      isExitEntry(d.entryType) &&
      d.positionId != null &&
      String(d.positionId).trim() === t
  );
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (a.dealTime >= b.dealTime ? a : b));
}

/** Deal keluar terbaru untuk symbol (hanya yang punya dealReason numerik). */
function latestExitForSymbol(
  symbol: string,
  deals: DealRowForCloseResolve[]
): DealRowForCloseResolve | null {
  const sym = normSym(symbol);
  const matches = deals.filter(
    (d) =>
      isExitEntry(d.entryType) &&
      d.symbol != null &&
      normSym(String(d.symbol)) === sym &&
      isFiniteDealReason(d.dealReason)
  );
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (a.dealTime >= b.dealTime ? a : b));
}

function profitToNumber(p: unknown): number | null {
  if (p == null) return null;
  if (typeof p === "number") return Number.isFinite(p) ? p : null;
  const n = Number(p);
  return Number.isFinite(n) ? n : null;
}

type ResolvedClose = { closeKind: Mt5CloseKind; dealComment: string | null };

/**
 * Untuk setiap posisi yang hilang dari snapshot: cari deal penutupan di batch ini lalu DB.
 */
export async function enrichClosedWithCloseKind(
  userId: string,
  mtLogin: string,
  closed: { ticket: string; symbol: string }[],
  dealsInBatch: DealRowForCloseResolve[]
): Promise<
  Array<{ ticket: string; symbol: string; closeKind: Mt5CloseKind; dealComment: string | null }>
> {
  if (closed.length === 0) return [];

  const resolvedByTicket = new Map<string, ResolvedClose>();

  const mergeResolved = (ticket: string, next: ResolvedClose) => {
    const prev = resolvedByTicket.get(ticket);
    const kind =
      next.closeKind !== "unknown" ? next.closeKind : prev?.closeKind ?? "unknown";
    resolvedByTicket.set(ticket, {
      closeKind: kind,
      dealComment: next.dealComment ?? prev?.dealComment ?? null,
    });
  };

  const needDb = new Set<string>();

  for (const c of closed) {
    const ex = latestExitForPosition(c.ticket, dealsInBatch);
    if (ex) {
      const closeKind = isFiniteDealReason(ex.dealReason)
        ? closeKindFromDealReason(ex.dealReason, ex.profit ?? null)
        : "unknown";
      resolvedByTicket.set(c.ticket, {
        closeKind,
        dealComment: sanitizeDealCommentForAlert(ex.comment),
      });
      if (!isFiniteDealReason(ex.dealReason)) needDb.add(c.ticket);
    } else {
      needDb.add(c.ticket);
    }
  }

  if (needDb.size > 0) {
    const rows = await prisma.mtDeal.findMany({
      where: {
        userId,
        mtLogin,
        entryType: { in: [DEAL_ENTRY_OUT, DEAL_ENTRY_OUT_BY] },
        positionId: { in: Array.from(needDb) },
      },
      orderBy: { dealTime: "desc" },
      select: { positionId: true, dealReason: true, profit: true, comment: true },
    });
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.positionId || seen.has(r.positionId)) continue;
      seen.add(r.positionId);
      mergeResolved(r.positionId, {
        closeKind: closeKindFromDealReason(r.dealReason, profitToNumber(r.profit)),
        dealComment: sanitizeDealCommentForAlert(r.comment),
      });
    }
  }

  const symCount = new Map<string, number>();
  for (const c of closed) {
    const k = normSym(c.symbol);
    symCount.set(k, (symCount.get(k) ?? 0) + 1);
  }

  for (const c of closed) {
    const cur = resolvedByTicket.get(c.ticket);
    if (cur && cur.closeKind !== "unknown") continue;
    if (symCount.get(normSym(c.symbol)) !== 1) continue;
    const ex2 = latestExitForSymbol(c.symbol, dealsInBatch);
    if (ex2 && isFiniteDealReason(ex2.dealReason)) {
      mergeResolved(c.ticket, {
        closeKind: closeKindFromDealReason(ex2.dealReason, ex2.profit ?? null),
        dealComment: sanitizeDealCommentForAlert(ex2.comment) ?? cur?.dealComment ?? null,
      });
    }
  }

  const recentCutoff = new Date(Date.now() - 25 * 60 * 1000);
  for (const c of closed) {
    const cur = resolvedByTicket.get(c.ticket);
    if (cur && cur.closeKind !== "unknown") continue;
    if (symCount.get(normSym(c.symbol)) !== 1) continue;
    const row = await prisma.mtDeal.findFirst({
      where: {
        userId,
        mtLogin,
        entryType: { in: [DEAL_ENTRY_OUT, DEAL_ENTRY_OUT_BY] },
        symbol: c.symbol.trim() || c.symbol,
        dealTime: { gte: recentCutoff },
        dealReason: { not: null },
      },
      orderBy: { dealTime: "desc" },
      select: { dealReason: true, profit: true, comment: true },
    });
    if (row?.dealReason != null) {
      mergeResolved(c.ticket, {
        closeKind: closeKindFromDealReason(row.dealReason, profitToNumber(row.profit)),
        dealComment: sanitizeDealCommentForAlert(row.comment) ?? cur?.dealComment ?? null,
      });
    }
  }

  return closed.map((c) => {
    const r = resolvedByTicket.get(c.ticket);
    return {
      ticket: c.ticket,
      symbol: c.symbol,
      closeKind: r?.closeKind ?? "unknown",
      dealComment: r?.dealComment ?? null,
    };
  });
}
