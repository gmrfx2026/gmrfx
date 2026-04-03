import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JobDetailClient } from "./JobDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await prisma.jobOffer.findUnique({ where: { id: params.id }, select: { title: true } });
  return { title: job ? `${job.title} — Penawaran Pekerjaan GMR FX` : "Penawaran Pekerjaan" };
}

export default async function JobDetailPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAdmin = session?.user?.role === "ADMIN";

  const job = await prisma.jobOffer.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, name: true, image: true, memberSlug: true } },
      winner: { select: { id: true, name: true, image: true, memberSlug: true } },
      bids: {
        orderBy: [{ priceIdr: "asc" }, { createdAt: "asc" }],
        include: { bidder: { select: { id: true, name: true, image: true, memberSlug: true } } },
      },
      deliverables: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!job) notFound();

  const canSeePrivate = isAdmin || userId === job.requesterId || userId === job.winnerId;

  const comments = canSeePrivate
    ? await prisma.jobComment.findMany({
        where: { jobId: params.id },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true } } },
      })
    : [];

  return (
    <JobDetailClient
      job={{
        ...job,
        budgetIdr: job.budgetIdr.toString(),
        bids: job.bids.map((b) => ({ ...b, priceIdr: b.priceIdr.toString() })),
        deliverables: canSeePrivate ? job.deliverables : [],
        expiresAt: job.expiresAt.toISOString(),
        deliveredAt: job.deliveredAt?.toISOString() ?? null,
        autoReleaseAt: job.autoReleaseAt?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        createdAt: job.createdAt.toISOString(),
      }}
      comments={comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
      userId={userId}
      isAdmin={isAdmin}
      canSeePrivate={canSeePrivate}
    />
  );
}
