import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadMtCommunityPublishRows, userOwnsMtLogin } from "@/lib/mtCommunityPublishRows";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  mtLogin: z.string().min(1).max(32),
  allowCopy: z.boolean(),
  allowWatch: z.boolean(),
  copyFree: z.boolean(),
  copyPriceIdr: z.number().min(0).default(0),
  watchAlertFree: z.boolean(),
  watchAlertPriceIdr: z.number().min(0).default(0),
  platform: z.enum(["mt4", "mt5"]),
});

const MIN_PAID_IDR = 1000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await loadMtCommunityPublishRows(session.user.id);
  return NextResponse.json({ accounts });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
  }

  const {
    mtLogin,
    allowCopy,
    allowWatch,
    copyFree,
    copyPriceIdr,
    watchAlertFree,
    watchAlertPriceIdr,
    platform,
  } = parsed.data;
  const userId = session.user.id;

  if (!(await userOwnsMtLogin(userId, mtLogin))) {
    return NextResponse.json({ error: "Login MetaTrader tidak terhubung ke akun Anda" }, { status: 403 });
  }

  if (allowCopy && !copyFree) {
    if (!Number.isFinite(copyPriceIdr) || copyPriceIdr < MIN_PAID_IDR) {
      return NextResponse.json(
        { error: `Harga copy berbayar minimal Rp ${MIN_PAID_IDR.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }
  }

  if (allowWatch && !watchAlertFree) {
    if (!Number.isFinite(watchAlertPriceIdr) || watchAlertPriceIdr < MIN_PAID_IDR) {
      return NextResponse.json(
        { error: `Harga alert Ikuti minimal Rp ${MIN_PAID_IDR.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }
  }

  const priceDec = new Prisma.Decimal(copyFree ? 0 : copyPriceIdr.toFixed(2));
  const watchPriceDec = new Prisma.Decimal(watchAlertFree ? 0 : watchAlertPriceIdr.toFixed(2));

  try {
    await prisma.mtCommunityPublishedAccount.upsert({
      where: {
        userId_mtLogin: { userId, mtLogin },
      },
      create: {
        userId,
        mtLogin,
        allowCopy,
        allowWatch,
        copyFree,
        copyPriceIdr: priceDec,
        watchAlertFree,
        watchAlertPriceIdr: watchPriceDec,
        platform,
      },
      update: {
        allowCopy,
        allowWatch,
        copyFree,
        copyPriceIdr: priceDec,
        watchAlertFree,
        watchAlertPriceIdr: watchPriceDec,
        platform,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("mt-community-publish PUT", e);
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}
