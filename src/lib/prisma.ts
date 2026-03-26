import { PrismaClient } from "@prisma/client";

/**
 * Neon (transaction pooler) + Prisma: tanpa `pgbouncer=true`, query tulis sering gagal
 * (prepared statement / pooler). URL dari integrasi Vercel–Neon kadang belum menyertakan ini.
 */
function resolvedDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL tidak di-set");
  }
  const isNeon = url.includes("neon.tech");
  const hasFlag = /[?&]pgbouncer=true(?:&|$)/.test(url);
  if (isNeon && !hasFlag) {
    return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: resolvedDatabaseUrl() },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
