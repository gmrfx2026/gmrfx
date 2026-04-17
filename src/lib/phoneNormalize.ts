/**
 * Normalisasi nomor telepon ke format canonical tanpa `+` (mirip E.164 tanpa plus).
 * Contoh:
 *   `+62 812-3456-7890` → `6281234567890`
 *   `081234567890`       → `6281234567890`  (prefiks lokal Indonesia)
 *   `6281234567890`      → `6281234567890`
 *   `+1 (555) 123-4567`  → `15551234567`
 *
 * - Angka di-strip dari spasi / tanda hubung / kurung / titik.
 * - Leading `+` dihapus.
 * - Jika dimulai dengan `0` dan panjang cocok dengan nomor Indonesia (≥10 digit total),
 *   `0` digantikan dengan `62` (asumsi pendaftar Indonesia).
 * - Validasi panjang E.164: 8–15 digit.
 *
 * Return `null` jika input tidak valid.
 */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[\s\-().\t]/g, "").trim();
  if (!cleaned) return null;

  const digits = cleaned.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;

  let canonical = digits;
  if (canonical.startsWith("0") && canonical.length >= 10) {
    canonical = "62" + canonical.slice(1);
  }

  if (canonical.length < 8 || canonical.length > 15) return null;

  return canonical;
}

/**
 * Beberapa variasi format yang harus dianggap sama dengan satu canonical.
 * Dipakai untuk query `IN (…)` saat cek duplikat supaya data lama yang belum di-backfill
 * (mis. `+6281…` dan `081…`) tetap kena.
 */
export function phoneVariants(canonical: string): string[] {
  const set = new Set<string>();
  set.add(canonical);
  set.add(`+${canonical}`);
  if (canonical.startsWith("62")) {
    const local = "0" + canonical.slice(2);
    set.add(local);
  }
  return Array.from(set);
}
