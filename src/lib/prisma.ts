import { PrismaClient } from "@prisma/client";

/** Tambah query param jika belum ada (tanpa `new URL()` — hindari merusak password dengan karakter khusus). */
function appendParamIfMissing(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`, "i").test(url)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${key}=${encodeURIComponent(value)}`;
}

/**
 * Neon / pooler + Prisma (serverless): `pgbouncer=true` + timeout.
 * Jangan pakai `connection_limit=1` di sini — bisa mengganggu beberapa query dalam satu handler.
 */
function resolvedDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL tidak di-set");
  }
  const looksNeon =
    raw.includes("neon.tech") ||
    raw.includes("neon.build") ||
    /@[^/?]*pooler[^/?]*\//i.test(raw) ||
    raw.includes("pooler");
  if (!looksNeon) return raw;
  let url = raw;
  url = appendParamIfMissing(url, "pgbouncer", "true");
  url = appendParamIfMissing(url, "connect_timeout", "15");
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
