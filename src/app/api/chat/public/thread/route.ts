import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ambil pesan terakhir untuk paging/polling.
  const messages = await prisma.publicChatMessage.findMany({
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      senderName: m.sender.name ?? m.sender.email,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

