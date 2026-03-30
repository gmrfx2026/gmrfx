import { prisma } from "@/lib/prisma";

/** MT5 DEAL_ENTRY */
export const DEAL_ENTRY_OUT = 1;
export const DEAL_ENTRY_OUT_BY = 3;

/** MT5 DEAL_REASON (inti untuk notifikasi penutupan) */
export const DEAL_REASON_SL = 4;
export const DEAL_REASON_TP = 5;
export const DEAL_REASON_SO = 6;

export type Mt5CloseKind = "tp" | "sl" | "stop_out" | "manual" | "unknown";

export function closeKindFromDealReason(reason: number | null | undefined): Mt5CloseKind {
  if (reason == null) return "unknown";
  if (reason === DEAL_REASON_TP) return "tp";
  if (reason === DEAL_REASON_SL) return "sl";
  if (reason === DEAL_REASON_SO) return "stop_out";
  return "manual";
}

export function closeKindLabelId(kind: Mt5CloseKind): string {
  switch (kind) {
    case "tp":
      return "terkena Take Profit";
    case "sl":
      return "terkena Stop Loss";
    case "stop_out":
      return "Stop out / margin";
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
};

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

/**
 * Untuk setiap posisi yang hilang dari snapshot: cari deal penutupan di batch ini lalu DB.
 */
export async function enrichClosedWithCloseKind(
  userId: string,
  mtLogin: string,
  closed: { ticket: string; symbol: string }[],
  dealsInBatch: DealRowForCloseResolve[]
): Promise<Array<{ ticket: string; symbol: string; closeKind: Mt5CloseKind }>> {
  if (closed.length === 0) return [];

  const kindByTicket = new Map<string, Mt5CloseKind>();
  const needDb = new Set<string>();

  for (const c of closed) {
    const ex = latestExitForPosition(c.ticket, dealsInBatch);
    if (ex && typeof ex.dealReason === "number") {
      kindByTicket.set(c.ticket, closeKindFromDealReason(ex.dealReason));
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
      select: { positionId: true, dealReason: true },
    });
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.positionId || seen.has(r.positionId)) continue;
      seen.add(r.positionId);
      if (!kindByTicket.has(r.positionId)) {
        kindByTicket.set(r.positionId, closeKindFromDealReason(r.dealReason));
      }
    }
  }

  return closed.map((c) => ({
    ticket: c.ticket,
    symbol: c.symbol,
    closeKind: kindByTicket.get(c.ticket) ?? "unknown",
  }));
}
