/**
 * Cek jumlah data katalog marketplace & penawaran di DB yang sedang di-`DATABASE_URL`.
 * Jalankan: npm run db:check:marketplace
 */
import { PrismaClient } from "@prisma/client";
import { loadRootEnv } from "./loadEnv";

loadRootEnv();

const prisma = new PrismaClient();

async function main() {
  console.log("Menghubungkan ke database (DATABASE_URL)…\n");

  const [indicatorsPub, easPub, jobsOpen, jobsTotal, pip, admin] = await Promise.all([
    prisma.sharedIndicator.count({ where: { published: true } }),
    prisma.sharedExpertAdvisor.count({ where: { published: true } }),
    prisma.jobOffer.count({ where: { status: "OPEN" } }),
    prisma.jobOffer.count(),
    prisma.user.findUnique({ where: { email: "piphunter@gmrfx.local" }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: "admin@gmrfx.local" }, select: { id: true } }),
  ]);

  console.log("— Katalog (published) —");
  console.log(`  SharedIndicator (indikator):     ${indicatorsPub}`);
  console.log(`  SharedExpertAdvisor (EA):        ${easPub}`);
  console.log("— Penawaran pekerjaan —");
  console.log(`  JobOffer OPEN:                   ${jobsOpen}`);
  console.log(`  JobOffer total:                  ${jobsTotal}`);
  console.log("— Akun seed —");
  console.log(`  piphunter@gmrfx.local:           ${pip ? "ada" : "TIDAK ADA"}`);
  console.log(`  admin@gmrfx.local:               ${admin ? "ada" : "TIDAK ADA"}`);

  const demoJob = await prisma.jobOffer.findFirst({
    where: { title: { startsWith: "[Demo]" } },
    select: { title: true },
  });
  const demoEa = await prisma.sharedExpertAdvisor.findUnique({
    where: { slug: "demo-ea-piphunter-stub-mt5" },
    select: { title: true, published: true },
  });

  console.log("\n— Data demo seed —");
  console.log(`  EA demo (slug demo-ea-…):        ${demoEa ? (demoEa.published ? "ada, published" : "ada, belum published") : "belum ada"}`);
  console.log(`  Penawaran judul [Demo]:         ${demoJob ? "ada" : "belum ada"}`);

  const issues: string[] = [];
  if (indicatorsPub === 0) issues.push("Indikator published kosong → jalankan `npm run db:seed:piphunter` (butuh file prisma/seed-data/piphunter/GMRFX_PipHunter_Stub.mq5).");
  if (easPub === 0) issues.push("EA published kosong → jalankan `npm run db:seed:marketplace`.");
  if (jobsOpen === 0 && jobsTotal === 0) issues.push("Penawaran kosong → jalankan `npm run db:seed:marketplace` (butuh admin@gmrfx.local).");
  if (!admin) issues.push("Admin seed belum ada → jalankan `npm run db:seed` sekali.");

  if (issues.length) {
    console.log("\n⚠ Yang perlu dilakukan:");
    issues.forEach((s) => console.log(`  • ${s}`));
    console.log("\nRingkas: `npx prisma migrate deploy` lalu `npm run db:seed` ATAU minimal:");
    console.log("  npm run db:seed:piphunter && npm run db:seed:marketplace");
    console.log("\nCatatan deploy (Coolify/VPS): seed TIDAK jalan otomatis saat build — tambahkan perintah seed setelah migrate di pipeline / one-shot container.");
  } else {
    console.log("\n✓ Tampak ada data marketplace/penawaran.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
