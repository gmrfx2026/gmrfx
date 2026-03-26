import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const [userAId, userBId] = orderedPair(session.user.id, peerId);

  const conv = await prisma.chatConversation.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  // Tandai pesan yang belum terbaca sebagai sudah terbaca.
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

  const messages = (conv?.messages ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt.toISOString(),
    }));

  return NextResponse.json({ messages });
}
