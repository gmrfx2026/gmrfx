import { PrismaClient, ArticleStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

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

  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (adminUser) {
    const titles = [
      "Mengenal margin dan leverage dalam forex",
      "Manajemen risiko untuk trader pemula",
      "Bedanya broker ECN dan market maker",
      "Cara membaca spread dan komisi",
      "Psikologi trading: hindari overtrading",
      "Jadwal sesi trading forex dunia",
    ];
    for (const title of titles) {
      const slug = slugify(title) + "-" + Math.random().toString(36).slice(2, 6);
      const dup = await prisma.article.findUnique({ where: { slug } });
      if (dup) continue;
      await prisma.article.create({
        data: {
          title,
          slug,
          excerpt: "Ringkasan edukasi forex untuk pembaca GMR FX.",
          contentHtml: `<p>${title}</p><p>Konten ini adalah contoh artikel dari admin. Silakan edit dari dashboard admin.</p>`,
          status: ArticleStatus.PUBLISHED,
          authorId: adminUser.id,
          publishedAt: new Date(),
        },
      });
    }
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
