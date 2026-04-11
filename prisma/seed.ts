import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedEducationalArticles } from "../src/lib/educationalArticlesSeed";
import { seedPiphunterIndicators } from "./seed-piphunter-indicators";
import { seedDemoExpertAdvisors, seedDemoJobOffers } from "./seed-marketplace-extras";
import { loadRootEnv } from "./loadEnv";

loadRootEnv();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@gmrfx.local";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    const hash = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrator",
        passwordHash: hash,
        role: Role.ADMIN,
        profileComplete: true,
        phoneWhatsApp: "6280000000000",
        addressLine: "Jl. Contoh",
        kecamatan: "Pusat",
        kabupaten: "Jakarta Pusat",
        provinsi: "DKI Jakarta",
        kodePos: "10110",
        negara: "Indonesia",
        walletAddress: "AD00001",
        walletBalance: 0,
      },
    });
    console.log("Admin dibuat:", admin.email, "/ password: admin123");
  }

  const edu = await seedEducationalArticles(prisma);
  if (edu.ok) {
    console.log(
      "Artikel edukasi forex:",
      edu.count,
      "judul · mode:",
      edu.mode,
      "· penulis:",
      edu.penulis,
      "(" + edu.authorDisplay + ")"
    );
  } else {
    console.log("Lewati artikel:", edu.error);
  }

  const cat = await prisma.galleryCategory.upsert({
    where: { slug: "edukasi-chart" },
    create: {
      name: "Edukasi & chart",
      slug: "edukasi-chart",
      description: "Ilustrasi pola dan edukasi visual.",
    },
    update: {},
  });

  await prisma.systemSetting.upsert({
    where: { key: "platform_fee_percent" },
    create: { key: "platform_fee_percent", value: "2.5" },
    update: {},
  });

  const ph = await seedPiphunterIndicators(prisma);
  console.log(ph.ok ? ph.message : "PipHunter:", ph.message);

  const ea = await seedDemoExpertAdvisors(prisma);
  console.log(ea.ok ? ea.message : "EA demo:", ea.message);
  const jobs = await seedDemoJobOffers(prisma);
  console.log(jobs.ok ? jobs.message : "Penawaran demo:", jobs.message);

  console.log("Seed selesai. Galeri kategori:", cat.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
