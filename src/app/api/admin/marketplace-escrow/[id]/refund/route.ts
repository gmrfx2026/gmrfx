import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { refundMarketplaceEscrowTx } from "@/lib/marketplaceEscrow";

export async function POST(
  req: Request,
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

  let adminNote: string | null = null;
  try {
    const body = await req.json();
    adminNote =
      body?.adminNote != null && String(body.adminNote).trim()
        ? String(body.adminNote).trim()
        : null;
  } catch {
    adminNote = null;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await refundMarketplaceEscrowTx(tx, holdId, adminNote);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal refund";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
