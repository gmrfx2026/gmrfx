import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_RATING = 40;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `indicator-rating:${session.user.id}:${clientKeyFromRequest(req)}`,
    MAX_RATING,
    WINDOW_MS,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 },
    );
  }

  const body = await req.json();
  const indicatorId = String(body.indicatorId ?? "");
  const stars = Number(body.stars);
  if (!indicatorId || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    return NextResponse.json({ error: "Rating tidak valid" }, { status: 400 });
  }

  const ind = await prisma.sharedIndicator.findFirst({
    where: { id: indicatorId, published: true },
    select: { sellerId: true },
  });
  if (!ind) {
    return NextResponse.json({ error: "Indikator tidak ditemukan" }, { status: 404 });
  }

  if (ind.sellerId === session.user.id) {
    return NextResponse.json({ error: "Penjual tidak dapat memberi rating pada produk sendiri" }, { status: 403 });
  }

  await prisma.indicatorRating.upsert({
    where: {
      indicatorId_userId: { indicatorId, userId: session.user.id },
    },
    create: { indicatorId, userId: session.user.id, stars },
    update: { stars },
  });

  return NextResponse.json({ ok: true });
}
