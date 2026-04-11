import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommentTarget } from "@prisma/client";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_TOGGLE = 80;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `comment-like:${session.user.id}:${clientKeyFromRequest(req)}`,
    MAX_TOGGLE,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak aksi. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const commentId = String((body as { commentId?: unknown })?.commentId ?? "");
  if (!commentId) {
    return NextResponse.json({ error: "commentId wajib" }, { status: 400 });
  }

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      targetType: CommentTarget.STATUS,
      hidden: false,
      status: { user: { memberStatus: "ACTIVE", profileComplete: true } },
    },
    select: { id: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Komentar tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.commentLike.findUnique({
    where: {
      commentId_userId: { commentId, userId: session.user.id },
    },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.commentLike.create({
      data: { commentId, userId: session.user.id },
    });
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  const liked = !existing;

  return NextResponse.json({ ok: true, liked, count });
}
