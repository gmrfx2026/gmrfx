/**
 * Hanya meng-upsert 8 artikel edukasi (PUBLISHED).
 * Pakai untuk database produksi tanpa menjalankan seed admin/galeri penuh:
 *
 *   npm run db:seed:articles
 *
 * Pastikan DATABASE_URL mengarah ke DB yang sama dengan deployment (Neon/Vercel).
 */
import { PrismaClient } from "@prisma/client";
import { seedEducationalArticles } from "./educationalArticlesSeed";

const prisma = new PrismaClient();

seedEducationalArticles(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
