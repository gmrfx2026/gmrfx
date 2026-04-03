import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// POST /api/penawaran/[id]/confirm — pemberi kerja konfirmasi pekerjaan selesai
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });
  if (job.requesterId !== userId) return NextResponse.json({ error: "Hanya pemberi kerja yang bisa konfirmasi" }, { status: 403 });
  if (job.status !== "DELIVERED") return NextResponse.json({ error: "Status harus DELIVERED untuk dikonfirmasi" }, { status: 409 });
  if (!job.winnerId) return NextResponse.json({ error: "Tidak ada pemenang" }, { status: 409 });

  const txId = `PAY-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

  await prisma.$transaction([
    prisma.jobOffer.update({ where: { id: params.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
    prisma.user.update({ where: { id: job.winnerId }, data: { walletBalance: { increment: job.budgetIdr } } }),
    prisma.walletTransfer.create({
      data: {
        transactionId: txId,
        fromUserId: job.requesterId,
        toUserId: job.winnerId,
        amount: job.budgetIdr,
        note: `[PAY-JOB] Pembayaran pekerjaan dikonfirmasi pemberi kerja`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
