import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashMt5ApiToken } from "@/lib/mt5Token";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const MAX_DEALS = 2500;

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

const bodySchema = z.object({
  login: z.union([z.string().min(1).max(32), z.number()]),
  server: z.string().max(256).optional(),
  deals: z.array(dealSchema).max(MAX_DEALS).nullish(),
  account: z
    .object({
      balance: z.number(),
      equity: z.number(),
      margin: z.number().optional(),
    })
    .optional(),
});

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

  const { login, deals, account } = parsed.data;
  const mtLogin = String(login);

  try {
    await prisma.$transaction(async (tx) => {
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
          },
        });
      }

      if (deals && deals.length > 0) {
        for (const d of deals) {
          const dealTime = new Date(d.dealTime * 1000);
          if (Number.isNaN(dealTime.getTime())) continue;

          let positionOpenAt: Date | null = null;
          if (d.positionOpenTime != null && d.positionOpenTime > 0) {
            const t = new Date(d.positionOpenTime * 1000);
            positionOpenAt = Number.isNaN(t.getTime()) ? null : t;
          }

          await tx.mtDeal.upsert({
            where: {
              userId_mtLogin_ticket: {
                userId: link.userId,
                mtLogin,
                ticket: d.ticket,
              },
            },
            create: {
              userId: link.userId,
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
      }
    });

    return NextResponse.json({
      ok: true,
      acceptedDeals: deals?.length ?? 0,
      snapshot: Boolean(account),
    });
  } catch (e) {
    console.error("mt5/ingest", e);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
