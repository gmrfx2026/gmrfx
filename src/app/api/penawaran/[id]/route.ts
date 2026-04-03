import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// GET /api/penawaran/[id] — detail pekerjaan
export async function GET(req: Request, { params }: Ctx) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAdmin = session?.user?.role === "ADMIN";

  const job = await prisma.jobOffer.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, name: true, image: true, memberSlug: true } },
      winner: { select: { id: true, name: true, image: true, memberSlug: true } },
      bids: {
        orderBy: { createdAt: "asc" },
        include: { bidder: { select: { id: true, name: true, image: true, memberSlug: true } } },
      },
      deliverables: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!job) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  // Komentar hanya untuk requester, winner, dan admin
  const canSeeComments =
    isAdmin || userId === job.requesterId || userId === job.winnerId;

  const comments = canSeeComments
    ? await prisma.jobComment.findMany({
        where: { jobId: params.id },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      })
    : [];

  // Sembunyikan fileUrl dari deliverable kecuali requester/winner/admin
  const safeDeliverables = canSeeComments
    ? job.deliverables
    : job.deliverables.map(({ fileUrl: _fileUrl, ...d }) => ({ ...d, fileUrl: null }));

  return NextResponse.json({
    ...job,
    budgetIdr: job.budgetIdr.toString(),
    bids: job.bids.map((b) => ({
      ...b,
      priceIdr: b.priceIdr.toString(),
    })),
    deliverables: safeDeliverables,
    comments,
    myBid: userId ? job.bids.find((b) => b.bidderId === userId) ?? null : null,
    isRequester: userId === job.requesterId,
    isWinner: userId === job.winnerId,
    canSeeComments,
  });
}
