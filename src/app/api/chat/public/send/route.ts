import { NextResponse } from "next/server";
import { auth } from "@/auth";
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const senderId = session.user.id;
  const text = sanitizePlainText(parsed.data.body, 4000);
  if (!text) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  await prisma.publicChatMessage.create({
    data: { senderId, body: text },
  });

  return NextResponse.json({ ok: true });
}

