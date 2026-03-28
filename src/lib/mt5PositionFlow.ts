/**
 * Alur data posisi MT5 (tanpa UI): durasi dari positionOpenTime → waktu deal penutupan.
 */

export type DealWithPositionTiming = {
  dealTime: Date;
  positionOpenTime: Date | null;
};

/** Detik durasi buka–tutup; null jika tidak ada waktu buka. */
export function positionDurationSeconds(deal: DealWithPositionTiming): number | null {
  if (!deal.positionOpenTime) return null;
  const ms = deal.dealTime.getTime() - deal.positionOpenTime.getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.floor(ms / 1000);
}
