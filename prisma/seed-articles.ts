/**
 * Hanya meng-upsert 8 artikel edukasi (PUBLISHED).
 * Pakai untuk database produksi tanpa menjalankan seed admin/galeri penuh:
 *
 *   npm run db:seed:articles
 *
 * Pastikan DATABASE_URL mengarah ke DB yang sama dengan deployment (Neon/Vercel).
 */
import { PrismaClient } from "@prisma/client";
import { seedEducationalArticles } from "../src/lib/educationalArticlesSeed";

const prisma = new PrismaClient();

seedEducationalArticles(prisma)
  .then((r) => {
    if (!r.ok) {
      console.error(r.error);
      process.exit(1);
    }
    console.log(
      "Artikel edukasi forex:",
      r.count,
      "judul · mode:",
      r.mode,
      "· penulis:",
      r.penulis,
      "(" + r.authorDisplay + ")"
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
