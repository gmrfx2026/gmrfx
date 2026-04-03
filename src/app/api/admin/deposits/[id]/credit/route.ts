import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

// POST /api/admin/deposits/[id]/credit
// Admin memaksa proses deposit FAILED/PENDING secara manual.
// Bisa override kurs IDR jika ingin dikreditkan dengan kurs tertentu.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depositId = params.id;
  const body = (await req.json()) as { rateIdr?: number; note?: string };

  const deposit = await prisma.usdtDepositRequest.findUnique({
    where: { id: depositId },
    include: { user: { select: { id: true, name: true, walletBalance: true } } },
  });

  if (!deposit) {
    return NextResponse.json({ error: "Deposit tidak ditemukan" }, { status: 404 });
  }

  if (deposit.status === "VERIFIED") {
    return NextResponse.json({ error: "Deposit sudah dikreditkan sebelumnya" }, { status: 409 });
  }

  // Gunakan kurs override dari admin, atau kurs lama jika sudah ada, atau 16000 fallback
  const rateIdr = body.rateIdr
    ? body.rateIdr
    : Number(deposit.rateIdr) > 0
    ? Number(deposit.rateIdr)
    : 16000;

  const amountUsdt = Number(deposit.amountUsdt);
  const amountIdr  = amountUsdt * rateIdr;

  if (amountUsdt <= 0) {
    return NextResponse.json(
      { error: "Jumlah USDT tidak valid (0). Gunakan form kredit manual jika perlu." },
      { status: 422 }
    );
  }

  await prisma.$transaction([
    prisma.usdtDepositRequest.update({
      where: { id: depositId },
      data: {
        status:     "VERIFIED",
        rateIdr:    new Decimal(rateIdr.toFixed(2)),
        amountIdr:  new Decimal(amountIdr.toFixed(2)),
        verifiedAt: new Date(),
        failReason: body.note
          ? `[Admin manual] ${body.note}`
          : "[Admin manual] Diproses oleh admin",
      },
    }),
    prisma.user.update({
      where: { id: deposit.userId },
      data: { walletBalance: { increment: new Decimal(amountIdr.toFixed(2)) } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    amountUsdt,
    rateIdr,
    amountIdr,
    memberName: deposit.user.name,
  });
}
