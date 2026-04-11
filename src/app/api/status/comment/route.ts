import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CommentTarget } from "@prisma/client";
import { sanitizePlainText } from "@/lib/sanitizePlainText";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";
import { validateStatusCommentMentions } from "@/lib/statusCommentMentions";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_POST = 24;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `status-comment:${session.user.id}:${clientKeyFromRequest(req)}`,
    MAX_POST,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak komentar. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json();
  const statusId = String(body.statusId ?? "");
  const content = sanitizePlainText(String(body.content ?? ""), 1500);
  if (!statusId || !content) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const status = await prisma.statusEntry.findFirst({
    where: {
      id: statusId,
      user: { memberStatus: "ACTIVE", profileComplete: true },
    },
  });

  if (!status) {
    return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 404 });
  }

  const mentionErr = await validateStatusCommentMentions(prisma, session.user.id, content);
  if (mentionErr) {
    return NextResponse.json({ error: mentionErr }, { status: 400 });
  }

  await prisma.comment.create({
    data: {
      targetType: CommentTarget.STATUS,
      statusId,
      statusOwnerId: status.userId,
      userId: session.user.id,
      content,
    },
  });

  return NextResponse.json({ ok: true });
}
