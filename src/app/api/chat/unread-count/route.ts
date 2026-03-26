import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const unread = await prisma.chatMessage.count({
      where: {
        readAt: null,
        senderId: { not: session.user.id },
        conversation: {
          OR: [{ userAId: session.user.id }, { userBId: session.user.id }],
        },
      },
    });
    return NextResponse.json({ unread });
  } catch (e) {
    console.error("chat/unread-count", e);
    return NextResponse.json({ unread: 0 });
  }
}

