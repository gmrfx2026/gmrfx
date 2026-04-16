/**
 * Sekali jalan: set SystemSetting `gmrfx_official_seller_user_id` dari email atau user id.
 *
 * Usage:
 *   node scripts/set-gmrfx-official-seller.mjs <email@x.com | userCuid>
 *
 * Memuat .env dan .env.local dari cwd (folder gmrfx2).
 */
import { config } from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const KEY = "gmrfx_official_seller_user_id";

const raw = process.argv[2]?.trim();
if (!raw) {
  console.error("Usage: node scripts/set-gmrfx-official-seller.mjs <email@domain.com | userId>");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = raw.includes("@")
    ? await prisma.user.findUnique({
        where: { email: raw.toLowerCase() },
        select: { id: true, email: true, name: true },
      })
    : await prisma.user.findUnique({
        where: { id: raw },
        select: { id: true, email: true, name: true },
      });

  if (!user) {
    console.error("User tidak ditemukan.");
    process.exit(1);
  }

  await prisma.systemSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: user.id },
    update: { value: user.id },
  });

  console.log("OK — gmrfx_official_seller_user_id =", user.id);
  console.log("     ", user.email, user.name ?? "");
} finally {
  await prisma.$disconnect();
}
