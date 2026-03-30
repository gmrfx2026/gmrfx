/**
 * Member demo PipHunter + indikator MT5 gratis (stub .mq5) + sampul via /api/indikator-cover/…
 * Idempotent: aman dijalankan ulang (slug unik).
 */
import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const EMAIL = "piphunter@gmrfx.local";
const DISPLAY_NAME = "PipHunter";
const MEMBER_SLUG = "piphunter";

type Def = {
  slug: string;
  title: string;
  clientFileName: string;
  coverImageUrl: string;
  description: string;
};

const INDICATORS: Def[] = [
  {
    slug: "piphunter-rsi-sederhana-mt5",
    title: "RSI Sederhana (contoh edukasi) MT5",
    clientFileName: "PipHunter_RSI_Sample.mq5",
    coverImageUrl: "/indikator-assets/covers/rsi.svg",
    description: `<p>Contoh paket edukasi seputar <strong>RSI</strong> (Relative Strength Index) untuk MetaTrader 5. File yang dilampirkan adalah <strong>stub</strong> — titik awal belajar, bukan sinyal jadi.</p><p>Penulis: <strong>PipHunter</strong> · Gratis · MT5.</p>`,
  },
  {
    slug: "piphunter-alert-ma-cross-mt5",
    title: "Alert persilangan Moving Average (stub) MT5",
    clientFileName: "PipHunter_MA_Cross_Sample.mq5",
    coverImageUrl: "/api/indikator-cover/ma-cross",
    description: `<p>Gambaran konsep <strong>dua kurva MA</strong> dan ide alert saat persilangan. File .mq5 berisi stub — Anda bisa kembangkan logika crossover sendiri di MetaEditor.</p><p>Penulis: <strong>PipHunter</strong> · Gratis · MT5.</p>`,
  },
  {
    slug: "piphunter-macd-histogram-mt5",
    title: "Panel konsep MACD / histogram (stub) MT5",
    clientFileName: "PipHunter_MACD_Sample.mq5",
    coverImageUrl: "/api/indikator-cover/macd",
    description: `<p>Ilustrasi konsep <strong>MACD</strong> dan histogram untuk pembelajaran. Lampiran berupa stub skrip — bukan EA atau indikator siap pakai berperforma.</p><p>Penulis: <strong>PipHunter</strong> · Gratis · MT5.</p>`,
  },
  {
    slug: "piphunter-zona-support-resistance-mt5",
    title: "Zona Support & Resistance (stub) MT5",
    clientFileName: "PipHunter_SR_Zones_Sample.mq5",
    coverImageUrl: "/api/indikator-cover/sr-zones",
    description: `<p>Kerangka berpikir <strong>level harga</strong> sebagai referensi, bukan prediksi mutlak. File stub untuk latihan menggambar atau menghitung zona di kode Anda sendiri.</p><p>Penulis: <strong>PipHunter</strong> · Gratis · MT5.</p>`,
  },
  {
    slug: "piphunter-session-high-low-mt5",
    title: "Penanda high/low sesi (stub) MT5",
    clientFileName: "PipHunter_Session_HiLo_Sample.mq5",
    coverImageUrl: "/api/indikator-cover/session-hilo",
    description: `<p>Konsep menandai <strong>high dan low</strong> per sesi perdagangan. Stub .mq5 untuk eksperimen; sesuaikan zona waktu dan aturan broker Anda.</p><p>Penulis: <strong>PipHunter</strong> · Gratis · MT5.</p>`,
  },
];

export async function seedPiphunterIndicators(prisma: PrismaClient): Promise<{ ok: boolean; message: string }> {
  const stubPath = path.join(process.cwd(), "prisma", "seed-data", "piphunter", "GMRFX_PipHunter_Stub.mq5");
  let stubBuf: Buffer;
  try {
    stubBuf = await readFile(stubPath);
  } catch {
    return { ok: false, message: "File stub mq5 tidak ditemukan: prisma/seed-data/piphunter/GMRFX_PipHunter_Stub.mq5" };
  }

  const hash = await bcrypt.hash("piphunter123", 12);
  const walletAddr = `PH_${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        name: DISPLAY_NAME,
        memberSlug: MEMBER_SLUG,
        passwordHash: hash,
        role: Role.USER,
        profileComplete: true,
        memberStatus: "ACTIVE",
        phoneWhatsApp: "6280000000001",
        addressLine: "—",
        kecamatan: "—",
        kabupaten: "Jakarta",
        provinsi: "DKI Jakarta",
        kodePos: "10110",
        negara: "Indonesia",
        walletAddress: walletAddr,
        walletBalance: 0,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: DISPLAY_NAME,
        memberSlug: MEMBER_SLUG,
        profileComplete: true,
        memberStatus: "ACTIVE",
      },
    });
    user = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  }

  const uploadRoot = path.join(process.cwd(), "public", "uploads", "indicators", user.id);
  await mkdir(uploadRoot, { recursive: true });

  for (const def of INDICATORS) {
    const existing = await prisma.sharedIndicator.findUnique({ where: { slug: def.slug } });
    let fileUrl = existing?.fileUrl ?? null;
    let fileName = existing?.fileName ?? def.clientFileName;

    if (!fileUrl) {
      const idPart = randomBytes(8).toString("hex");
      const diskName = `${idPart}.mq5`;
      const abs = path.join(uploadRoot, diskName);
      await writeFile(abs, stubBuf);
      fileUrl = `/uploads/indicators/${user.id}/${diskName}`;
      fileName = def.clientFileName;
    }

    await prisma.sharedIndicator.upsert({
      where: { slug: def.slug },
      create: {
        sellerId: user.id,
        title: def.title,
        slug: def.slug,
        description: def.description,
        priceIdr: 0,
        fileUrl,
        fileName,
        platform: "mt5",
        coverImageUrl: def.coverImageUrl,
        published: true,
      },
      update: {
        title: def.title,
        description: def.description,
        coverImageUrl: def.coverImageUrl,
        published: true,
        priceIdr: 0,
        platform: "mt5",
      },
    });
  }

  return {
    ok: true,
    message: `PipHunter: ${INDICATORS.length} indikator · login ${EMAIL} / piphunter123 (ganti setelah produksi).`,
  };
}
