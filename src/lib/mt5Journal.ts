/** Batas hari & kalender jurnal memakai zona Asia/Jakarta (WIB). */

export const JOURNAL_TIMEZONE = "Asia/Jakarta";

export function jakartaDayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JOURNAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** [start, end] UTC inklusif untuk semua deal yang jatuh pada bulan kalender Jakarta (y, m). */
export function jakartaMonthUtcRange(y: number, m: number): { start: Date; end: Date } {
  const start = new Date(`${y}-${pad2(m)}-01T00:00:00+07:00`);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  const nextStart = new Date(`${nextY}-${pad2(nextM)}-01T00:00:00+07:00`);
  return { start, end: new Date(nextStart.getTime() - 1) };
}

export function jakartaTodayParts(): { y: number; m: number; d: number; dayKey: string } {
  const key = jakartaDayKey(new Date());
  const [y, m, d] = key.split("-").map((x) => Number.parseInt(x, 10));
  return { y, m, d, dayKey: key };
}

export function daysInMonth(y: number, calendarMonth: number): number {
  return new Date(Date.UTC(y, calendarMonth, 0)).getUTCDate();
}

/** Senin = 0 … Minggu = 6 untuk tanggal 1.. di bulan (Jakarta). */
export function jakartaWeekdayMon0FromYMD(y: number, m: number, day: number): number {
  const inst = new Date(`${y}-${pad2(m)}-${pad2(day)}T12:00:00+07:00`);
  const short = new Intl.DateTimeFormat("en", {
    timeZone: JOURNAL_TIMEZONE,
    weekday: "short",
  }).format(inst);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[short] ?? 0;
}

export function clampDay(y: number, m: number, d: number): number {
  const max = daysInMonth(y, m);
  if (!Number.isFinite(d) || d < 1) return 1;
  return Math.min(d, max);
}

export function dayKeyFromYMD(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(clampDay(y, m, d))}`;
}

export function formatJournalDateDMY(dayKey: string): string {
  const [y, m, d] = dayKey.split("-");
  if (!y || !m || !d) return dayKey;
  return `${d}.${m}.${y}`;
}

export function prevMonth(y: number, m: number): { y: number; m: number } {
  if (m <= 1) return { y: y - 1, m: 12 };
  return { y, m: m - 1 };
}

export function nextMonth(y: number, m: number): { y: number; m: number } {
  if (m >= 12) return { y: y + 1, m: 1 };
  return { y, m: m + 1 };
}
