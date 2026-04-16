import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { chatDbErrorMessage } from "@/lib/chatDbErrorMessage";
import { getPrivateDmAccess } from "@/lib/chatDmAccess";
import { prisma } from "@/lib/prisma";
import { memberEmailForViewer } from "@/lib/memberEmailDisplay";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const peerId = searchParams.get("peerId");
  if (!peerId) {
    return NextResponse.json({ error: "peerId wajib" }, { status: 400 });
  }

  try {
    const dmAccess = await getPrivateDmAccess(session.user.id, peerId);
    if (!dmAccess.allowed) {
      return NextResponse.json({ messages: [], dmAccess });
    }

    const [userAId, userBId] = orderedPair(session.user.id, peerId);

    const conv = await prisma.chatConversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            sender: { select: { id: true, name: true, email: true, image: true, memberSlug: true } },
          },
        },
      },
    });

    if (conv) {
      await prisma.chatMessage.updateMany({
        where: {
          conversationId: conv.id,
          senderId: { not: session.user.id },
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    }

    const viewerId = session.user.id;
    const messages = (conv?.messages ?? [])
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName:
          m.sender.name ?? memberEmailForViewer(m.sender.email, m.sender.id, viewerId),
        senderImage: m.sender.image,
        senderMemberSlug: m.sender.memberSlug,
        createdAt: m.createdAt.toISOString(),
      }));

    return NextResponse.json({ messages, dmAccess });
  } catch (e) {
    console.error("chat/thread", e);
    let dmAccess;
    try {
      dmAccess = await getPrivateDmAccess(session.user.id, peerId);
    } catch {
      dmAccess = { allowed: false, state: "need_request" as const };
    }
    return NextResponse.json(
      {
        messages: [],
        dmAccess,
        error: chatDbErrorMessage(e),
      },
      { status: 200 }
    );
  }
}
