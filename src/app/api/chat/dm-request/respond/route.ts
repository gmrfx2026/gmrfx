import { NextResponse } from "next/server";
import { ChatDmRequestStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatDbErrorMessage } from "@/lib/chatDbErrorMessage";
import { isUserProfileComplete } from "@/lib/profileComplete";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isUserProfileComplete(session.user.id))) {
      return NextResponse.json({ error: "Lengkapi profil terlebih dahulu." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
    }

    /** User yang meminta chat (bukan Anda). */
    const requesterId = String((body as { requesterId?: unknown })?.requesterId ?? "");
    const accept = Boolean((body as { accept?: unknown })?.accept);

    if (!requesterId || requesterId === session.user.id) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const reqRow = await prisma.chatDmRequest.findUnique({
      where: {
        requesterId_targetId: { requesterId, targetId: session.user.id },
      },
    });

    if (!reqRow || reqRow.status !== ChatDmRequestStatus.PENDING) {
      return NextResponse.json(
        { error: "Permintaan tidak ditemukan atau sudah diproses." },
        { status: 404 }
      );
    }

    if (!accept) {
      await prisma.chatDmRequest.update({
        where: { id: reqRow.id },
        data: { status: ChatDmRequestStatus.DECLINED, respondedAt: new Date() },
      });
      return NextResponse.json({ ok: true, state: "declined" as const });
    }

    const [userAId, userBId] = orderedPair(requesterId, session.user.id);

    await prisma.$transaction(async (tx) => {
      await tx.chatDmRequest.update({
        where: { id: reqRow.id },
        data: { status: ChatDmRequestStatus.ACCEPTED, respondedAt: new Date() },
      });

      let conv = await tx.chatConversation.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!conv) {
        conv = await tx.chatConversation.create({
          data: { userAId, userBId },
        });
      }

      const intro = reqRow.introMessage?.trim();
      if (intro) {
        await tx.chatMessage.create({
          data: {
            conversationId: conv.id,
            senderId: requesterId,
            body: intro,
          },
        });
      }

      await tx.chatConversation.update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true, state: "accepted" as const });
  } catch (e) {
    console.error("chat/dm-request/respond", e);
    return NextResponse.json({ error: chatDbErrorMessage(e) }, { status: 500 });
  }
}
