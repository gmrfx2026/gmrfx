import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientKeyFromRequest, rateLimit } from "@/lib/simpleRateLimit";

const WINDOW_MS = 60 * 1000;
const MAX_DEL = 30;

export async function DELETE(
  _req: Request,
  context: { params: { statusId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(
    `status-del:${session.user.id}:${clientKeyFromRequest(_req)}`,
    MAX_DEL,
    WINDOW_MS
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  const statusId = context.params.statusId;
  if (!statusId) {
    return NextResponse.json({ error: "statusId wajib" }, { status: 400 });
  }

  const status = await prisma.statusEntry.findFirst({
    where: { id: statusId, userId: session.user.id },
  });

  if (!status) {
    return NextResponse.json({ error: "Status tidak ditemukan atau bukan milik Anda." }, { status: 404 });
  }

  await prisma.statusEntry.delete({ where: { id: status.id } });

  return NextResponse.json({ ok: true });
}
