import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { releaseEscrowToSellerTx } from "@/lib/marketplaceEscrow";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const holdId = String(id ?? "").trim();
  if (!holdId) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await releaseEscrowToSellerTx(tx, holdId, {
        forceBeforeReleaseAt: true,
        allowDisputed: true,
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal cairkan";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
