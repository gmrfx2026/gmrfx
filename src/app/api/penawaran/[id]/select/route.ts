import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/penawaran/[id]/select — pemberi kerja memilih pemenang
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const job = await prisma.jobOffer.findUnique({
    where: { id: params.id },
    include: { bids: { select: { id: true, bidderId: true } } },
  });
  if (!job) return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });
  if (job.requesterId !== userId) return NextResponse.json({ error: "Hanya pemberi kerja yang bisa memilih pemenang" }, { status: 403 });
  if (job.status !== "OPEN") return NextResponse.json({ error: "Pekerjaan sudah tidak bisa diubah" }, { status: 409 });

  let body: { bidId?: string };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }

  const selectedBid = job.bids.find((b) => b.id === body.bidId);
  if (!selectedBid) return NextResponse.json({ error: "Tawaran tidak ditemukan" }, { status: 404 });

  await prisma.$transaction([
    prisma.jobOffer.update({
      where: { id: params.id },
      data: { status: "ASSIGNED", winnerId: selectedBid.bidderId },
    }),
    // Tandai bid yang dipilih sebagai SELECTED, tolak sisanya
    prisma.jobBid.update({ where: { id: selectedBid.id }, data: { status: "SELECTED" } }),
    prisma.jobBid.updateMany({
      where: { jobId: params.id, id: { not: selectedBid.id } },
      data: { status: "REJECTED" },
    }),
  ]);

  return NextResponse.json({ ok: true, winnerId: selectedBid.bidderId });
}
