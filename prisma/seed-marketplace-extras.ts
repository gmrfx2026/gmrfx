/**
 * Data demo: EA katalog + penawaran pekerjaan (dana konsisten dengan wallet).
 * Idempotent: aman dijalankan ulang (slug / judul demo unik).
 */
import type { PrismaClient } from "@prisma/client";
import { JobCategory } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DEMO_EA_SLUG = "demo-ea-piphunter-stub-mt5";
const PIPHUNTER_EMAIL = "piphunter@gmrfx.local";
const ADMIN_EMAIL = "admin@gmrfx.local";
const DEMO_JOB_TITLES = [
  "[Demo] Butuh EA scalping XAUUSD timeframe rendah",
  "[Demo] Indikator custom volume & sesi Asia di MT5",
] as const;

export async function seedDemoExpertAdvisors(prisma: PrismaClient): Promise<{ ok: boolean; message: string }> {
  const stubPath = path.join(process.cwd(), "prisma", "seed-data", "piphunter", "GMRFX_PipHunter_Stub.mq5");
  let stubBuf: Buffer;
  try {
    stubBuf = await readFile(stubPath);
  } catch {
    return { ok: false, message: "Stub .mq5 tidak ada — jalankan dari repo lengkap (prisma/seed-data/piphunter/)." };
  }

  let seller = await prisma.user.findUnique({ where: { email: PIPHUNTER_EMAIL } });
  let sellerLabel = PIPHUNTER_EMAIL;
  if (!seller) {
    seller = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    sellerLabel = ADMIN_EMAIL;
  }
  if (!seller) {
    return {
      ok: false,
      message: `Tidak ada penjual demo — buat ${PIPHUNTER_EMAIL} (db:seed:piphunter) atau ${ADMIN_EMAIL} (db:seed).`,
    };
  }

  const existing = await prisma.sharedExpertAdvisor.findUnique({ where: { slug: DEMO_EA_SLUG } });
  let fileUrl = existing?.fileUrl ?? null;
  let fileName = existing?.fileName ?? "GMRFX_Demo_EA_Stub.mq5";

  if (!fileUrl) {
    const uploadRoot = path.join(process.cwd(), "public", "uploads", "eas", seller.id);
    await mkdir(uploadRoot, { recursive: true });
    const idPart = randomBytes(8).toString("hex");
    const diskName = `${idPart}.mq5`;
    await writeFile(path.join(uploadRoot, diskName), stubBuf);
    fileUrl = `/uploads/eas/${seller.id}/${diskName}`;
  }

  await prisma.sharedExpertAdvisor.upsert({
    where: { slug: DEMO_EA_SLUG },
    create: {
      sellerId: seller.id,
      title: "EA edukasi (stub) — contoh katalog",
      slug: DEMO_EA_SLUG,
      description:
        "<p><strong>Contoh listing EA</strong> untuk mengisi katalog. File adalah stub .mq5 yang sama dengan materi PipHunter — bukan robot siap produksi.</p>",
      priceIdr: 0,
      fileUrl,
      fileName,
      platform: "mt5",
      published: true,
    },
    update: {
      title: "EA edukasi (stub) — contoh katalog",
      description:
        "<p><strong>Contoh listing EA</strong> untuk mengisi katalog. File adalah stub .mq5 yang sama dengan materi PipHunter — bukan robot siap produksi.</p>",
      priceIdr: 0,
      platform: "mt5",
      published: true,
    },
  });

  return { ok: true, message: `EA demo: slug ${DEMO_EA_SLUG} · penjual ${sellerLabel}` };
}

export async function seedDemoJobOffers(prisma: PrismaClient): Promise<{ ok: boolean; message: string }> {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    return { ok: false, message: `User ${ADMIN_EMAIL} tidak ada — jalankan npm run db:seed sekali agar admin terbuat.` };
  }

  const already = await prisma.jobOffer.findFirst({
    where: { title: DEMO_JOB_TITLES[0] },
    select: { id: true },
  });
  if (already) {
    return { ok: true, message: "Penawaran demo sudah ada — lewati." };
  }

  const topUp = new Decimal(2_000_000);
  const jobs: { title: string; category: JobCategory; budget: number; html: string }[] = [
    {
      title: DEMO_JOB_TITLES[0],
      category: JobCategory.EA,
      budget: 250_000,
      html: "<p>Mencari <strong>programmer MQL5</strong> untuk EA scalping pada XAUUSD. Spesifikasi detail akan dibahas setelah bid dipilih. Ini <strong>data demo</strong> untuk pengujian fitur penawaran.</p>",
    },
    {
      title: DEMO_JOB_TITLES[1],
      category: JobCategory.INDICATOR,
      budget: 175_000,
      html: "<p>Butuh <strong>indikator MT5</strong> yang menampilkan volume relatif dan jendela sesi Asia. Minimal 20 karakter teks — ini contoh isi <strong>demo</strong>.</p>",
    },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: admin.id },
      data: { walletBalance: { increment: topUp } },
    });

    for (const j of jobs) {
      const budget = new Decimal(j.budget);
      const expiresAt = new Date(Date.now() + 30 * 86_400_000);
      const txId = `JOB-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

      await tx.jobOffer.create({
        data: {
          title: j.title.slice(0, 200),
          description: j.html,
          category: j.category,
          budgetIdr: budget,
          expiresAt,
          requesterId: admin.id,
        },
      });
      await tx.user.update({
        where: { id: admin.id },
        data: { walletBalance: { decrement: budget } },
      });
      await tx.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: admin.id,
          toUserId: admin.id,
          amount: budget,
          note: "[ESCROW-JOB] Dana dikunci untuk penawaran pekerjaan (seed demo)",
        },
      });
    }
  });

  return {
    ok: true,
    message: `Penawaran demo: ${jobs.length} listing OPEN · requester ${ADMIN_EMAIL} · top-up seed Rp ${topUp.toString()} lalu escrow sesuai budget.`,
  };
}
