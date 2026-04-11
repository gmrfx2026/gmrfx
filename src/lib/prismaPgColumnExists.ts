import { prisma } from "@/lib/prisma";

/** Hanya pasangan yang dipakai app — tidak menerima input bebas. */
const ALLOWED = new Set([
  "HomeNewsItem|imageSourceUrl",
  "SharedIndicator|coverImageUrl",
  /** Satu sentinel untuk migrasi withdraw / metode pembayaran di `User`. */
  "User|bankName",
]);

/** Hanya cache `true` — jika kolom belum ada, tiap request cek ulang (murah) agar setelah migrasi tanpa restart tetap terdeteksi. */
const existsCache = new Map<string, true>();

/**
 * Cek apakah kolom ada di PostgreSQL (pg_catalog), hasil di-cache per proses.
 * Dipakai agar Prisma tidak pernah mengirim SELECT kolom yang belum dimigrasi
 * (menghindari P2022 + spam `prisma:error` di log meski ada try/catch).
 */
export async function prismaPgColumnExistsPublic(table: string, column: string): Promise<boolean> {
  if (!ALLOWED.has(`${table}|${column}`)) {
    throw new Error(`prismaPgColumnExistsPublic: kolom tidak diizinkan (${table}.${column})`);
  }
  const key = `${table}.${column}`;
  if (existsCache.has(key)) return true;
  try {
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = ${table}
          AND a.attname = ${column}
          AND a.attnum > 0
          AND NOT a.attisdropped
      ) AS exists
    `;
    const ok = Boolean(rows[0]?.exists);
    if (ok) existsCache.set(key, true);
    return ok;
  } catch {
    return false;
  }
}
