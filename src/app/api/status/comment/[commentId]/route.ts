import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommentTarget } from "@prisma/client";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 60 * 1000;
const MAX_DEL = 40;

export async function DELETE(
  _req: Request,
  context: { params: { commentId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `status-comment-del:${session.user.id}:${clientKeyFromRequest(_req)}`,
    MAX_DEL,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const commentId = context.params.commentId;
  if (!commentId) {
    return NextResponse.json({ error: "commentId wajib" }, { status: 400 });
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, targetType: CommentTarget.STATUS },
    include: { status: { select: { userId: true } } },
  });

  if (!comment || !comment.statusId) {
    return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });
  }

  const isAuthor = comment.userId === session.user.id;
  const statusOwnerId = comment.status?.userId ?? comment.statusOwnerId;
  const isStatusOwner = statusOwnerId === session.user.id;

  if (!isAuthor && !isStatusOwner) {
    return NextResponse.json({ error: "Tidak diizinkan menghapus komentar ini." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: comment.id } });

  return NextResponse.json({ ok: true });
}
