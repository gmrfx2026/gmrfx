/**
 * Gagalkan deploy jika migrasi 20260329210000 masih berisi ALTER ke tabel published account
 * (bug urutan lama). Jalankan dari root repo sebelum `prisma migrate deploy`.
 */
const fs = require("fs");
const path = require("path");

const p = path.join(
  __dirname,
  "..",
  "prisma",
  "migrations",
  "20260329210000_community_watch_alert_pricing",
  "migration.sql"
);
const s = fs.readFileSync(p, "utf8");
// Hanya deteksi pernyataan ALTER yang menyentuh tabel itu (bukan sekadar komentar).
const bad =
  /\bALTER\s+TABLE\s+"MtCommunityPublishedAccount"/i.test(s) ||
  /\bALTER\s+TABLE\s+MtCommunityPublishedAccount\b/i.test(s);
if (bad) {
  console.error(
    "[assert-migration-292100] FAIL: migration.sql masih mengubah tabel published account.\n" +
      "Lakukan git pull (commit perbaikan migrasi) atau pastikan image/build memakai prisma/migrations terbaru.\n" +
      "File: " +
      p
  );
  process.exit(1);
}
console.log("[assert-migration-292100] OK");
