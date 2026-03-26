import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

const WINDOW_MS = 60 * 1000;
const MAX_CHAT = 45;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isUserProfileComplete(session.user.id))) {
    return NextResponse.json({ error: "Lengkapi profil terlebih dahulu." }, { status: 403 });
  }

  const rl = rateLimit(`chat-send:${session.user.id}:${clientKeyFromRequest(req)}`, MAX_CHAT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak pesan. Tunggu sebentar.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const body = await req.json();
  const peerId = String(body.peerId ?? "");
  const text = sanitizePlainText(String(body.body ?? ""), 4000);
  if (!peerId || !text) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  if (peerId === session.user.id) {
    return NextResponse.json({ error: "Peer tidak valid" }, { status: 400 });
  }

  const peer = await prisma.user.findFirst({
    where: { id: peerId, memberStatus: "ACTIVE", profileComplete: true },
  });
  if (!peer) {
    return NextResponse.json(
      { error: "Member tidak ditemukan atau belum melengkapi profil." },
      { status: 404 }
    );
  }

  const [userAId, userBId] = orderedPair(session.user.id, peerId);

  try {
    let conv = await prisma.chatConversation.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (!conv) {
      conv = await prisma.chatConversation.create({
        data: { userAId, userBId },
      });
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: session.user.id,
        body: text,
      },
    });

    await prisma.chatConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true, conversationId: conv.id });
  } catch (e) {
    console.error("chat/send", e);
    return NextResponse.json(
      {
        error:
          "Gagal menyimpan pesan. Pastikan migrasi database sudah dijalankan di server (ChatConversation / ChatMessage).",
      },
      { status: 500 }
    );
  }
}
