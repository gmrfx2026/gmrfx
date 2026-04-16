/**
 * Indikator contoh GMRFX ZZ v3.2.1 untuk admin / katalog (lisensi MT + berbayar ringan).
 * Idempotent: aman dijalankan ulang.
 */
import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { GMRFX_OFFICIAL_SELLER_SETTING_KEY } from "../src/lib/gmrfxOfficialSeller";

const ADMIN_EMAIL = "admin@gmrfx.local";
const SLUG = "gmrfx-zz-v321-contoh";
/** Harga demo (IDR) — harus > 0 agar alur pembelian + lisensi MT jalan */
const DEMO_PRICE_IDR = new Decimal("10000");
const MT_PRODUCT_CODE = "GMRFX_ZZ";
const MT_VALIDITY_DAYS = 365;

const MQ5_CANDIDATES = [
  path.join(process.cwd(), "mql5", "GMRFX_ZZ_V3.2.1.mq5"),
  path.join(process.cwd(), "mql5", "GMRFX_ZZ_V3.2.mq5"),
];

async function resolveOfficialSellerId(prisma: PrismaClient): Promise<string | null> {
  const envId = process.env.GMRFX_OFFICIAL_SELLER_USER_ID?.trim();
  if (envId) return envId;

  const row = await prisma.systemSetting.findUnique({
    where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY },
  });
  const dbId = row?.value?.trim();
  if (dbId) return dbId;

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    return null;
  }

  if (!row) {
    await prisma.systemSetting.create({
      data: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY, value: admin.id },
    });
  } else if (!dbId) {
    await prisma.systemSetting.update({
      where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY },
      data: { value: admin.id },
    });
  }

  return admin.id;
}

export async function seedGmrfxZzExample(prisma: PrismaClient): Promise<{ ok: boolean; message: string }> {
  const sellerId = await resolveOfficialSellerId(prisma);
  if (!sellerId) {
    return {
      ok: false,
      message: `Contoh GMRFX ZZ: tidak ada penjual resmi — buat ${ADMIN_EMAIL} (npm run db:seed) lalu jalankan lagi.`,
    };
  }

  let buf: Buffer | null = null;
  for (const p of MQ5_CANDIDATES) {
    try {
      buf = await readFile(p);
      break;
    } catch {
      /* next */
    }
  }
  if (!buf) {
    return {
      ok: false,
      message: "Contoh GMRFX ZZ: sumber .mq5 tidak ditemukan (mql5/GMRFX_ZZ_V3.2.1.mq5).",
    };
  }

  const existing = await prisma.sharedIndicator.findUnique({ where: { slug: SLUG } });
  let fileUrl = existing?.fileUrl ?? null;
  let fileName = existing?.fileName ?? "GMRFX_ZZ_V3.2.1.mq5";

  if (!fileUrl) {
    const uploadRoot = path.join(process.cwd(), "public", "uploads", "indicators", sellerId);
    await mkdir(uploadRoot, { recursive: true });
    const idPart = randomBytes(8).toString("hex");
    const diskName = `${idPart}.mq5`;
    await writeFile(path.join(uploadRoot, diskName), buf);
    fileUrl = `/uploads/indicators/${sellerId}/${diskName}`;
    fileName = "GMRFX_ZZ_V3.2.1.mq5";
  }

  const description = `<p><strong>Contoh indikator resmi GMRFX</strong> untuk tim admin: ZigZag, garis horizontal S/R, zona supply/demand, dan fitur lanjutan. Sumber kode ada di repo <code>mql5/GMRFX_ZZ_V3.2.1.mq5</code>.</p>
<p><strong>Lisensi MT:</strong> kode produk <code>${MT_PRODUCT_CODE}</code> — sama dengan input <em>Product Code</em> di MetaTrader. Setelah pembelian, member mendapat license key di profil; masa berlaku contoh: <strong>${MT_VALIDITY_DAYS} hari</strong>.</p>
<p>Harga listing ini hanya untuk <strong>demo alur berbayar</strong> (Rp ${DEMO_PRICE_IDR.toString()}); sesuaikan di admin jika perlu.</p>`;

  await prisma.sharedIndicator.upsert({
    where: { slug: SLUG },
    create: {
      sellerId,
      title: "[Contoh admin] GMRFX ZZ v3.2.1 — ZigZag & level",
      slug: SLUG,
      description,
      priceIdr: DEMO_PRICE_IDR,
      fileUrl,
      fileName,
      platform: "mt5",
      coverImageUrl: "/api/indikator-cover/sr-zones",
      published: true,
      isGmrfxOfficial: true,
      mtLicenseProductCode: MT_PRODUCT_CODE,
      mtLicenseValidityDays: MT_VALIDITY_DAYS,
    },
    update: {
      sellerId,
      title: "[Contoh admin] GMRFX ZZ v3.2.1 — ZigZag & level",
      description,
      priceIdr: DEMO_PRICE_IDR,
      fileUrl,
      fileName,
      platform: "mt5",
      coverImageUrl: "/api/indikator-cover/sr-zones",
      published: true,
      isGmrfxOfficial: true,
      mtLicenseProductCode: MT_PRODUCT_CODE,
      mtLicenseValidityDays: MT_VALIDITY_DAYS,
    },
  });

  return {
    ok: true,
    message: `Contoh GMRFX ZZ: slug ${SLUG} · lisensi ${MT_PRODUCT_CODE} · /admin/gmrfx-indicators`,
  };
}
