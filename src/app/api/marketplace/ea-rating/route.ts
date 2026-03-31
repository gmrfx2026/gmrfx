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
    `ea-rating:${session.user.id}:${clientKeyFromRequest(req)}`,
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
  const eaId = String(body.eaId ?? "");
  const stars = Number(body.stars);
  if (!eaId || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    return NextResponse.json({ error: "Rating tidak valid" }, { status: 400 });
  }

  const ea = await prisma.sharedExpertAdvisor.findFirst({
    where: { id: eaId, published: true },
    select: { sellerId: true },
  });
  if (!ea) {
    return NextResponse.json({ error: "EA tidak ditemukan" }, { status: 404 });
  }

  if (ea.sellerId === session.user.id) {
    return NextResponse.json({ error: "Penjual tidak dapat memberi rating pada produk sendiri" }, { status: 403 });
  }

  await prisma.eaRating.upsert({
    where: {
      eaId_userId: { eaId, userId: session.user.id },
    },
    create: { eaId, userId: session.user.id, stars },
    update: { stars },
  });

  return NextResponse.json({ ok: true });
}
