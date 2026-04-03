import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/job-offers/[id]/resolve
 *
 * action:
 *   "release"      — cairkan dana ke pemenang (DISPUTED / DELIVERED)
 *   "refund"       — kembalikan dana ke pemberi kerja + batalkan (DISPUTED / ASSIGNED / OPEN)
 *   "note"         — tambah/update catatan admin (semua status)
 *   "force_cancel" — paksa batalkan + refund (OPEN / ASSIGNED)
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { action?: string; note?: string };
  const action = (body.action ?? "").trim();
  const note = (body.note ?? "").trim().slice(0, 1000);

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });

  // ── Cairkan ke pemenang ──────────────────────────────────────────────────
  if (action === "release") {
    if (!job.winnerId) return NextResponse.json({ error: "Tidak ada pemenang" }, { status: 409 });
    if (!["DISPUTED", "DELIVERED", "ASSIGNED"].includes(job.status)) {
      return NextResponse.json({ error: `Status "${job.status}" tidak bisa dicairkan` }, { status: 409 });
    }
    const txId = `ADM-PAY-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    await prisma.$transaction([
      prisma.jobOffer.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          adminNote: note || `[Admin] Dana dicairkan ke pemenang`,
        },
      }),
      prisma.user.update({
        where: { id: job.winnerId },
        data: { walletBalance: { increment: job.budgetIdr } },
      }),
      prisma.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: job.requesterId,
          toUserId: job.winnerId,
          amount: job.budgetIdr,
          note: `[ADM-PAY-JOB] Admin cairkan pembayaran pekerjaan${note ? ": " + note : ""}`,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, action: "release" });
  }

  // ── Refund ke pemberi kerja ───────────────────────────────────────────────
  if (action === "refund" || action === "force_cancel") {
    const allowedStatuses = ["DISPUTED", "ASSIGNED", "OPEN", "DELIVERED"];
    if (!allowedStatuses.includes(job.status)) {
      return NextResponse.json({ error: `Status "${job.status}" tidak bisa direfund` }, { status: 409 });
    }
    const txId = `ADM-REF-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    await prisma.$transaction([
      prisma.jobOffer.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          adminNote: note || `[Admin] Dana dikembalikan ke pemberi kerja`,
        },
      }),
      prisma.user.update({
        where: { id: job.requesterId },
        data: { walletBalance: { increment: job.budgetIdr } },
      }),
      prisma.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: job.requesterId,
          toUserId: job.requesterId,
          amount: job.budgetIdr,
          note: `[ADM-REFUND-JOB] Admin kembalikan dana pekerjaan${note ? ": " + note : ""}`,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, action });
  }

  // ── Tambah / update catatan admin ─────────────────────────────────────────
  if (action === "note") {
    if (!note) return NextResponse.json({ error: "Catatan tidak boleh kosong" }, { status: 400 });
    await prisma.jobOffer.update({
      where: { id: params.id },
      data: { adminNote: note },
    });
    return NextResponse.json({ ok: true, action: "note" });
  }

  return NextResponse.json({ error: `Action tidak dikenal: ${action}` }, { status: 400 });
}
