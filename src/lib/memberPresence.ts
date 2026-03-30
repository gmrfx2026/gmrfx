import { formatJakarta } from "@/lib/jakartaDateFormat";

/** Sama dengan jendela "online" di chat profil: aktivitas dalam N menit dianggap masih aktif. */
export const MEMBER_ONLINE_WINDOW_MINUTES = 5;

export function memberOnlineCutoff(): Date {
  return new Date(Date.now() - MEMBER_ONLINE_WINDOW_MINUTES * 60 * 1000);
}

/** Teks singkat untuk admin (daftar online). */
export function formatMemberLastSeenRelative(last: Date, nowMs = Date.now()): string {
  const diffSec = Math.floor((nowMs - last.getTime()) / 1000);
  if (diffSec < 45) return "Baru saja";
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))} mnt lalu`;
  return formatJakarta(last, { dateStyle: "short", timeStyle: "short" });
}
