import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashMt5ApiToken } from "@/lib/mt5Token";
import {
  notifyCommunityMtActivityWatchers,
  resolveCommunityMtDisplayName,
} from "@/lib/communityMtActivityNotifications";
import { diffOpenPositionsByTicket } from "@/lib/mtTradingActivityPositionDiff";
import { parseTradingActivityFromDb } from "@/lib/mtTradingActivity";
import { Prisma } from "@prisma/client";
import { z } from "zod";

/** Vercel: ingest bisa lama jika banyak deal; hindari batas default ~5s. */
export const maxDuration = 60;

const MAX_DEALS = 2500;
/** Satu transaksi DB terlalu lama di Neon/pgBouncer + serverless → "Transaction not found". */
const DEAL_UPSERT_CHUNK = 32;

/** String opsional dari EA: trim, rapatkan spasi, buang kontrol, batasi panjang. */
function optionalAccountMetaString(maxLen: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null) return undefined;
      let s = String(v).trim().replace(/\r?\n/g, " ").replace(/\s+/g, " ");
      s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
      if (s.length > maxLen) s = s.slice(0, maxLen);
      return s.length > 0 ? s : undefined;
    });
}

const dealSchema = z.object({
  ticket: z.string().min(1).max(32),
  dealTime: z.coerce.number().int(),
  // MT5: deal saldo/kredit/internal sering symbol kosong — tanpa ini payload ditolak (HTTP 400).
  symbol: z.preprocess(
    (v) => (typeof v === "string" ? v : ""),
    z
      .string()
      .max(64)
      .transform((s) => (s.trim().length > 0 ? s.trim() : "(internal)")),
  ),
  dealType: z.number().int(),
  entryType: z.number().int(),
  volume: z.number(),
  price: z.number(),
  commission: z.number().optional(),
  swap: z.number().optional(),
  profit: z.number().optional(),
  magic: z.number().int().optional(),
  comment: z.string().max(512).optional(),
  positionId: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null) return null;
      const s = String(v).trim();
      if (!s || s === "0") return null;
      return s.length > 32 ? s.slice(0, 32) : s;
    }),
  positionOpenTime: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n <= 0) return undefined;
      return Math.trunc(n);
    }),
});

const openPositionIngestSchema = z.object({
  ticket: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim().slice(0, 32))
    .refine((s) => s.length > 0, "ticket"),
  symbol: z
    .string()
    .max(64)
    .transform((s) => (s.trim().length > 0 ? s.trim() : "(internal)")),
  side: z.number().int(),
  volume: z.number(),
  priceOpen: z.number(),
  priceCurrent: z.number().optional(),
  sl: z.union([z.number(), z.null()]).optional(),
  tp: z.union([z.number(), z.null()]).optional(),
  profit: z.number().optional().default(0),
  swap: z.number().optional().default(0),
  commission: z.number().optional().default(0),
  openTime: z.number().int(),
  points: z.union([z.number(), z.null()]).optional(),
});

const pendingOrderIngestSchema = z.object({
  ticket: z
    .union([z.string(), z.number()])
    .transform((v) => String(v).trim().slice(0, 32))
    .refine((s) => s.length > 0, "ticket"),
  symbol: z
    .string()
    .max(64)
    .transform((s) => (s.trim().length > 0 ? s.trim() : "(internal)")),
  orderType: z.number().int(),
  volume: z.number(),
  priceOrder: z.number(),
  sl: z.union([z.number(), z.null()]).optional(),
  tp: z.union([z.number(), z.null()]).optional(),
  setupTime: z.number().int(),
});

const bodySchema = z.object({
  login: z.union([z.string().min(1).max(32), z.number()]),
  server: z.string().max(256).optional(),
  platform: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null) return undefined;
      const s = String(v).trim().toLowerCase();
      if (s === "mt4") return "mt4";
      if (s === "mt5") return "mt5";
      return undefined;
    }),
  deals: z.array(dealSchema).max(MAX_DEALS).nullish(),
  account: z
    .object({
      balance: z.number(),
      equity: z.number(),
      margin: z.number().optional(),
      tradeAccountName: optionalAccountMetaString(128),
      currency: z
        .union([z.string(), z.null(), z.undefined()])
        .optional()
        .transform((v) => {
          if (v == null) return undefined;
          const s = String(v).trim().toUpperCase();
          if (s.length < 2 || s.length > 12) return undefined;
          if (!/^[A-Z0-9]+$/.test(s)) return undefined;
          return s;
        }),
      brokerName: optionalAccountMetaString(128),
      brokerServer: optionalAccountMetaString(128),
    })
    .optional(),
  openPositions: z.array(openPositionIngestSchema).max(200).optional(),
  pendingOrders: z.array(pendingOrderIngestSchema).max(200).optional(),
});

type ParsedDeal = z.infer<typeof dealSchema>;

function mtDealUpsertOp(d: ParsedDeal, userId: string, mtLogin: string) {
  const dealTime = new Date(d.dealTime * 1000);
  if (Number.isNaN(dealTime.getTime())) return null;

  let positionOpenAt: Date | null = null;
  if (d.positionOpenTime != null && d.positionOpenTime > 0) {
    const t = new Date(d.positionOpenTime * 1000);
    positionOpenAt = Number.isNaN(t.getTime()) ? null : t;
  }

  return prisma.mtDeal.upsert({
    where: {
      userId_mtLogin_ticket: {
        userId,
        mtLogin,
        ticket: d.ticket,
      },
    },
    create: {
      userId,
      mtLogin,
      ticket: d.ticket,
      dealTime,
      symbol: d.symbol,
      dealType: d.dealType,
      entryType: d.entryType,
      volume: new Prisma.Decimal(d.volume),
      price: new Prisma.Decimal(d.price),
      commission: new Prisma.Decimal(d.commission ?? 0),
      swap: new Prisma.Decimal(d.swap ?? 0),
      profit: new Prisma.Decimal(d.profit ?? 0),
      magic: d.magic ?? 0,
      comment: d.comment ?? "",
      positionId: d.positionId ?? null,
      positionOpenTime: positionOpenAt,
    },
    update: {
      dealTime,
      symbol: d.symbol,
      dealType: d.dealType,
      entryType: d.entryType,
      volume: new Prisma.Decimal(d.volume),
      price: new Prisma.Decimal(d.price),
      commission: new Prisma.Decimal(d.commission ?? 0),
      swap: new Prisma.Decimal(d.swap ?? 0),
      profit: new Prisma.Decimal(d.profit ?? 0),
      magic: d.magic ?? 0,
      comment: d.comment ?? "",
      positionId: d.positionId ?? null,
      positionOpenTime: positionOpenAt,
    },
  });
}

function authToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (h?.startsWith("Bearer ")) return h.slice(7).trim();
  const x = req.headers.get("x-mt5-token");
  return x?.trim() || null;
}

export async function POST(req: Request) {
  const rawToken = authToken(req);
  if (!rawToken || rawToken.length < 16) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenHash = hashMt5ApiToken(rawToken);
  const link = await prisma.mtLinkToken.findFirst({
    where: { tokenHash, revokedAt: null },
    select: { id: true, userId: true },
  });
  if (!link) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { login, deals, account, platform, openPositions, pendingOrders } = parsed.data;
  const mtLogin = String(login);
  const shouldUpsertActivity = openPositions !== undefined || pendingOrders !== undefined;

  const prevActivityForDiff =
    shouldUpsertActivity && openPositions !== undefined
      ? await prisma.mtTradingActivity.findUnique({
          where: { userId_mtLogin: { userId: link.userId, mtLogin } },
          select: { positions: true },
        })
      : null;

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.mtLinkToken.update({
          where: { id: link.id },
          data: { lastUsedAt: new Date() },
        });

        if (account) {
          await tx.mtAccountSnapshot.create({
            data: {
              userId: link.userId,
              mtLogin,
              balance: new Prisma.Decimal(account.balance),
              equity: new Prisma.Decimal(account.equity),
              margin: new Prisma.Decimal(account.margin ?? 0),
              currency: account.currency ?? null,
              brokerName: account.brokerName ?? null,
              brokerServer: account.brokerServer ?? null,
              tradeAccountName: account.tradeAccountName ?? null,
              sourcePlatform: platform ?? null,
            },
          });
        }

        if (shouldUpsertActivity) {
          const posJson = (openPositions ?? []) as Prisma.InputJsonValue;
          const pendJson = (pendingOrders ?? []) as Prisma.InputJsonValue;
          await tx.mtTradingActivity.upsert({
            where: {
              userId_mtLogin: { userId: link.userId, mtLogin },
            },
            create: {
              userId: link.userId,
              mtLogin,
              positions: posJson,
              pendingOrders: pendJson,
            },
            update: {
              positions: posJson,
              pendingOrders: pendJson,
            },
          });
        }
      },
      { maxWait: 10_000, timeout: 15_000 }
    );

    if (openPositions !== undefined && prevActivityForDiff) {
      const prevPos = parseTradingActivityFromDb(prevActivityForDiff.positions, []).positions;
      const nextTickets = openPositions.map((p) => ({ ticket: p.ticket, symbol: p.symbol }));
      const { opened, closed } = diffOpenPositionsByTicket(prevPos, nextTickets);
      if (opened.length > 0 || closed.length > 0) {
        const publisherUserId = link.userId;
        void (async () => {
          try {
            const displayName = await resolveCommunityMtDisplayName(publisherUserId, mtLogin);
            await notifyCommunityMtActivityWatchers({
              publisherUserId,
              mtLogin,
              displayName,
              opened,
              closed,
            });
          } catch (e) {
            console.error("mt5/ingest community watch notify", e);
          }
        })();
      }
    }

    if (deals && deals.length > 0) {
      for (let i = 0; i < deals.length; i += DEAL_UPSERT_CHUNK) {
        const slice = deals.slice(i, i + DEAL_UPSERT_CHUNK);
        const ops = slice
          .map((d) => mtDealUpsertOp(d, link.userId, mtLogin))
          .filter((op): op is NonNullable<typeof op> => op != null);
        if (ops.length === 0) continue;
        await prisma.$transaction(ops);
      }
    }

    return NextResponse.json({
      ok: true,
      acceptedDeals: deals?.length ?? 0,
      snapshot: Boolean(account),
      activity: shouldUpsertActivity,
    });
  } catch (e) {
    console.error("mt5/ingest", e);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
