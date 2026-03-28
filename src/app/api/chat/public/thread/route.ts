import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { chatDbErrorMessage } from "@/lib/chatDbErrorMessage";
import { memberEmailForViewer } from "@/lib/memberEmailDisplay";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.publicChatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { sender: { select: { name: true, email: true } } },
    });

    const viewerId = session.user.id;
    return NextResponse.json({
      messages: rows.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName:
          m.sender.name ??
          memberEmailForViewer(m.sender.email, m.senderId, viewerId),
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("chat/public/thread", e);
    return NextResponse.json(
      {
        messages: [],
        error: chatDbErrorMessage(e),
      },
      { status: 200 }
    );
  }
}

