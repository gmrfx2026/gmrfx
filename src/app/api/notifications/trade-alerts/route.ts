import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Polling ringan: notifikasi alert posisi komunitas setelah `after` (ISO). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const afterRaw = searchParams.get("after");
  const after = afterRaw ? new Date(afterRaw) : null;
  if (!after || Number.isNaN(after.getTime())) {
    return NextResponse.json({ error: "Parameter after (ISO) wajib" }, { status: 400 });
  }

  const rows = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      type: NotificationType.COMMUNITY_MT_TRADE_ALERT,
      createdAt: { gt: after },
    },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: {
      id: true,
      title: true,
      body: true,
      linkUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
