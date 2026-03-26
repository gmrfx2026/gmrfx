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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: resolvedDatabaseUrl() },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Lazy init: hindari throw saat modul dimuat jika env belum siap; error baru muncul saat query pertama. */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
