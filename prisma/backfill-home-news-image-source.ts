/**
 * Isi `imageSourceUrl` dari gambar HTTPS pertama di `contentHtml` (baris yang masih punya <img>).
 * Jalankan sekali setelah migrate: `npx tsx prisma/backfill-home-news-image-source.ts`
 */
import { PrismaClient } from "@prisma/client";
import { extractFirstImageUrlFromNewsHtml } from "../src/lib/homeNewsDisplayImage";
import { loadRootEnv } from "./loadEnv";

loadRootEnv();

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.homeNewsItem.findMany({
    where: { imageSourceUrl: null },
    select: { id: true, contentHtml: true },
  });
  let updated = 0;
  for (const r of rows) {
    const url = extractFirstImageUrlFromNewsHtml(r.contentHtml);
    if (!url) continue;
    await prisma.homeNewsItem.update({ where: { id: r.id }, data: { imageSourceUrl: url } });
    updated++;
  }
  console.log(`home news imageSourceUrl: updated ${updated} / scanned ${rows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
