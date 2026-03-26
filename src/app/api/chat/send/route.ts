import { NextResponse } from "next/server";
import { chatDbErrorMessage } from "@/lib/chatDbErrorMessage";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { prisma } from "@/lib/prisma";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

/** Inline — hindari bundel isomorphic-dompurify/jsdom di function chat (Vercel ERR_REQUIRE_ESM). */
function sanitizeChatBody(text: string, maxLen: number): string {
  return text.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

const WINDOW_MS = 60 * 1000;
const MAX_CHAT = 45;

export async function POST(req: Request) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      if (!(await isUserProfileComplete(session.user.id))) {
        return NextResponse.json({ error: "Lengkapi profil terlebih dahulu." }, { status: 403 });
      }
    } catch (e) {
      console.error("chat/send profile", e);
      return NextResponse.json({ error: chatDbErrorMessage(e) }, { status: 500 });
    }

    const rl = rateLimit(`chat-send:${session.user.id}:${clientKeyFromRequest(req)}`, MAX_CHAT, WINDOW_MS);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak pesan. Tunggu sebentar.", retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
    }
    const peerId = String((body as { peerId?: unknown })?.peerId ?? "");
    const text = sanitizeChatBody(String((body as { body?: unknown })?.body ?? ""), 4000);
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
      console.error("chat/send prisma", e);
      return NextResponse.json({ error: chatDbErrorMessage(e) }, { status: 500 });
    }
  } catch (e) {
    console.error("chat/send", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kesalahan server saat mengirim chat." },
      { status: 500 }
    );
  }
}
