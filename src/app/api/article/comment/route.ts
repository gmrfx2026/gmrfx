import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommentTarget, ArticleStatus } from "@prisma/client";
import { sanitizePlainText } from "@/lib/sanitize";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_POST = 24;
const MAX_MUTATE = 40;

function limitKey(kind: string, userId: string, req: Request) {
  return `${kind}:${userId}:${clientKeyFromRequest(req)}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = rateLimit(limitKey("article-comment-post", session.user.id, req), MAX_POST, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak komentar. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json();
  const articleId = String(body.articleId ?? "");
  const content = sanitizePlainText(String(body.content ?? ""), 2000);
  if (!articleId || !content) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const article = await prisma.article.findFirst({
    where: { id: articleId, status: ArticleStatus.PUBLISHED },
  });
  if (!article) {
    return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
  }

  await prisma.comment.create({
    data: {
      targetType: CommentTarget.ARTICLE,
      articleId,
      userId: session.user.id,
      content,
    },
  });

  return NextResponse.json({ ok: true });
}

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = rateLimit(limitKey("article-comment-patch", session.user.id, req), MAX_MUTATE, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  const content = sanitizePlainText(String(body.content ?? ""), 2000);
  if (!id || !content) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const row = await prisma.comment.findFirst({
    where: { id, targetType: CommentTarget.ARTICLE },
  });
  if (!row || row.userId !== session.user.id) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  if (Date.now() - new Date(row.createdAt).getTime() > EDIT_WINDOW_MS) {
    return NextResponse.json({ error: "Masa pengeditan habis (15 menit)" }, { status: 403 });
  }

  await prisma.comment.update({
    where: { id },
    data: { content },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = rateLimit(limitKey("article-comment-del", session.user.id, req), MAX_MUTATE, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") ?? "");
  if (!id) {
    return NextResponse.json({ error: "id wajib" }, { status: 400 });
  }

  const row = await prisma.comment.findFirst({
    where: { id, targetType: CommentTarget.ARTICLE },
  });
  if (!row || row.userId !== session.user.id) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
  if (Date.now() - new Date(row.createdAt).getTime() > EDIT_WINDOW_MS) {
    return NextResponse.json({ error: "Masa penghapusan habis (15 menit)" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
