import { PrismaClient } from "@prisma/client";

/**
 * Neon / pooler + Prisma (serverless): tambahkan parameter yang disarankan agar
 * koneksi stabil dan prepared statement tidak bentrok dengan PgBouncer.
 */
function resolvedDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL tidak di-set");
  }
  try {
    const u = new URL(raw);
    const host = u.hostname;
    const looksNeon = host.includes("neon.tech") || host.includes("neon.build");
    const looksPooler = host.includes("pooler");
    if (looksNeon || looksPooler) {
      if (!u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "15");
      if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
    }
    return u.toString();
  } catch {
    const isNeon = raw.includes("neon.tech") || raw.includes("pooler");
    const hasPgb = /[?&]pgbouncer=true(?:&|$)/.test(raw);
    if (isNeon && !hasPgb) {
      return raw + (raw.includes("?") ? "&" : "?") + "pgbouncer=true";
    }
    return raw;
  }
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
