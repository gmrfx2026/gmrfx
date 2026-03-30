import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MarketplaceEscrowStatus } from "@prisma/client";
import { openMarketplaceEscrowDisputeTx } from "@/lib/marketplaceEscrow";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const holdId = String(id ?? "").trim();
  if (!holdId) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  let body: { reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON wajib" }, { status: 400 });
  }

  const reason = String(body?.reason ?? "");

  try {
    await prisma.$transaction(async (tx) => {
      const hold = await tx.marketplaceEscrowHold.findUnique({
        where: { id: holdId },
        select: { buyerId: true, status: true },
      });
      if (!hold || hold.buyerId !== session.user!.id) {
        throw new Error("FORBIDDEN");
      }
      if (hold.status !== MarketplaceEscrowStatus.PENDING) {
        throw new Error("STATE");
      }
      await openMarketplaceEscrowDisputeTx(tx, holdId, session.user!.id, reason);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (msg === "STATE") {
      return NextResponse.json({ error: "Komplain tidak dapat diajukan" }, { status: 400 });
    }
    return NextResponse.json({ error: msg || "Gagal" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
