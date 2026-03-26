import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_TOGGLE = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`status-like:${session.user.id}:${clientKeyFromRequest(req)}`, MAX_TOGGLE, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak aksi. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const statusId = String((body as { statusId?: unknown })?.statusId ?? "");
  if (!statusId) {
    return NextResponse.json({ error: "statusId wajib" }, { status: 400 });
  }

  const status = await prisma.statusEntry.findFirst({
    where: {
      id: statusId,
      user: { memberStatus: "ACTIVE", profileComplete: true },
    },
    select: { id: true },
  });

  if (!status) {
    return NextResponse.json({ error: "Status tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.statusLike.findUnique({
    where: {
      statusId_userId: { statusId, userId: session.user.id },
    },
  });

  if (existing) {
    await prisma.statusLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.statusLike.create({
      data: { statusId, userId: session.user.id },
    });
  }

  const count = await prisma.statusLike.count({ where: { statusId } });
  const liked = !existing;

  return NextResponse.json({ ok: true, liked, count });
}
