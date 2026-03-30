import type { MtOpenPositionRow } from "@/lib/mtTradingActivity";

export type PositionTicketChange = { ticket: string; symbol: string };

/** Bandingkan snapshot posisi terbuka (ticket + symbol) untuk deteksi buka/tutup. */
export function diffOpenPositionsByTicket(
  previous: MtOpenPositionRow[],
  next: { ticket: string; symbol: string }[]
): { opened: PositionTicketChange[]; closed: PositionTicketChange[] } {
  const prevMap = new Map(previous.map((p) => [p.ticket, p.symbol]));
  const nextMap = new Map(next.map((p) => [p.ticket, p.symbol]));

  const opened: PositionTicketChange[] = [];
  nextMap.forEach((symbol, ticket) => {
    if (!prevMap.has(ticket)) opened.push({ ticket, symbol });
  });
  const closed: PositionTicketChange[] = [];
  prevMap.forEach((symbol, ticket) => {
    if (!nextMap.has(ticket)) closed.push({ ticket, symbol });
  });
  return { opened, closed };
}
