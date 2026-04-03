import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// POST /api/admin/wallet-adjust
// Admin menambah atau mengurangi saldo IDR member secara manual.
// Tercatat sebagai WalletTransfer dengan note khusus untuk audit trail.
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminId = session.user.id!;

  const body = (await req.json()) as {
    userId?: string;
    amount?: number;   // positif = kredit, negatif = debit
    note?: string;
  };

  const targetUserId = (body.userId ?? "").trim();
  if (!targetUserId) {
    return NextResponse.json({ error: "userId wajib diisi" }, { status: 400 });
  }

  const amount = Number(body.amount ?? 0);
  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "Jumlah tidak valid (tidak boleh 0)" }, { status: 400 });
  }

  const note = (body.note ?? "").trim() || "Penyesuaian saldo oleh admin";

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, walletBalance: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  const newBalance = Number(target.walletBalance) + amount;
  if (newBalance < 0) {
    return NextResponse.json(
      {
        error: `Saldo tidak cukup. Saldo saat ini: Rp ${Number(target.walletBalance).toLocaleString("id-ID")}`,
      },
      { status: 422 }
    );
  }

  const txId = `ADM-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

  // Kredit: admin → member; Debit: member → admin (untuk konsistensi model WalletTransfer)
  const [fromId, toId] =
    amount > 0 ? [adminId, targetUserId] : [targetUserId, adminId];

  await prisma.$transaction([
    prisma.walletTransfer.create({
      data: {
        transactionId: txId,
        fromUserId:    fromId,
        toUserId:      toId,
        amount:        new Decimal(Math.abs(amount).toFixed(2)),
        note:          `[ADMIN] ${note}`,
      },
    }),
    prisma.user.update({
      where: { id: targetUserId },
      data:  { walletBalance: new Decimal(newBalance.toFixed(2)) },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    txId,
    memberName: target.name,
    amount,
    newBalance,
  });
}
