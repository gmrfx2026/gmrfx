import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Minimal jarak antar tulis ke DB (detik) untuk mengurangi beban. */
const THROTTLE_SEC = 55;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.USER) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const userId = session.user.id;
  const now = new Date();

  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { memberLastSeenAt: true },
    });

    if (u?.memberLastSeenAt) {
      const elapsedSec = (now.getTime() - u.memberLastSeenAt.getTime()) / 1000;
      if (elapsedSec < THROTTLE_SEC) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { memberLastSeenAt: now },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      console.warn("[activity-ping] memberLastSeenAt belum tersedia di database; skip ping.");
      return NextResponse.json({ ok: true, skipped: true, reason: "memberLastSeenAt-unavailable" });
    }
    throw error;
  }
}
