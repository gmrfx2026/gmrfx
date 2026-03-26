import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_RATING = 40;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `article-rating:${session.user.id}:${clientKeyFromRequest(req)}`,
    MAX_RATING,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json();
  const articleId = String(body.articleId ?? "");
  const stars = Number(body.stars);
  if (!articleId || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    return NextResponse.json({ error: "Rating tidak valid" }, { status: 400 });
  }

  const article = await prisma.article.findFirst({
    where: { id: articleId, status: ArticleStatus.PUBLISHED },
  });
  if (!article) {
    return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
  }

  if (article.authorId === session.user.id) {
    return NextResponse.json({ error: "Penulis tidak dapat memberi rating pada artikel sendiri" }, { status: 403 });
  }

  await prisma.articleRating.upsert({
    where: {
      articleId_userId: { articleId, userId: session.user.id },
    },
    create: { articleId, userId: session.user.id, stars },
    update: { stars },
  });

  return NextResponse.json({ ok: true });
}
