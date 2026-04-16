import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewerId = session.user.id;

  try {
    const baseWhere = {
      readAt: null,
      senderId: { not: viewerId },
      conversation: {
        OR: [{ userAId: viewerId }, { userBId: viewerId }],
      },
    };

    const [unread, latestUnread] = await Promise.all([
      prisma.chatMessage.count({ where: baseWhere }),
      prisma.chatMessage.findFirst({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        select: { senderId: true },
      }),
    ]);

    return NextResponse.json({
      unread,
      /** Pengirim pesan privat terbaru yang belum dibaca (untuk fokus thread di dock). */
      latestUnreadFromId: latestUnread?.senderId ?? null,
    });
  } catch (e) {
    console.error("chat/unread-count", e);
    return NextResponse.json({ unread: 0, latestUnreadFromId: null });
  }
}

