import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { chatDbErrorMessage } from "@/lib/chatDbErrorMessage";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";
import { z } from "zod";

const schema = z.object({
  body: z.string().trim().min(1).max(4000),
});

const WINDOW_MS = 60 * 1000;
const MAX_PUBLIC = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      if (!(await isUserProfileComplete(session.user.id))) {
        return NextResponse.json({ error: "Lengkapi profil terlebih dahulu." }, { status: 403 });
      }
    } catch (e) {
      console.error("chat/public/send profile", e);
      return NextResponse.json({ error: chatDbErrorMessage(e) }, { status: 500 });
    }

    const rl = rateLimit(
      `chat-public-send:${session.user.id}:${clientKeyFromRequest(req)}`,
      MAX_PUBLIC,
      WINDOW_MS
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak pesan. Tunggu sebentar.", retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const senderId = session.user.id;
    const text = sanitizePlainText(parsed.data.body, 4000);
    if (!text) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    try {
      await prisma.publicChatMessage.create({
        data: { senderId, body: text },
      });
    } catch (e) {
      console.error("chat/public/send prisma", e);
      return NextResponse.json({ error: chatDbErrorMessage(e) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("chat/public/send", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kesalahan server saat mengirim chat." },
      { status: 500 }
    );
  }
}

