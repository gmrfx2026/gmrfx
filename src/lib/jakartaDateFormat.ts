import { JOURNAL_TIMEZONE } from "@/lib/mt5Journal";

/** Zona waktu tampilan untuk pengguna Indonesia (sama dengan jurnal MT5). */
export const JAKARTA_TIMEZONE = JOURNAL_TIMEZONE;

export function formatJakarta(
  input: Date | string | number,
  options: Intl.DateTimeFormatOptions,
): string {
  const d = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat("id-ID", {
    ...options,
    timeZone: JAKARTA_TIMEZONE,
  }).format(d);
}
