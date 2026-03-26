import { Prisma } from "@prisma/client";

/** Pesan untuk error Prisma/Postgres saat tabel chat belum dimigrasi. */
export function chatDbErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/does not exist|42P01|undefined_table|no such table|relation.*not exist/i.test(msg)) {
    return "Tabel chat belum ada di database. Jalankan migrasi: npx prisma migrate deploy (pakai URL database direct ke Neon).";
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return `Gagal database (${e.code}). Pastikan migrasi Prisma sudah dijalankan di produksi.`;
  }
  return msg.length > 10 ? msg.slice(0, 200) : "Gagal menyimpan pesan chat.";
}
