import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { newTransactionId } from "@/lib/txid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const toWallet = String(body.toWallet ?? "").trim().toUpperCase();
  const amountNum = Number(body.amount);
  if (!toWallet || !Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const amount = new Decimal(amountNum.toFixed(2));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const from = await tx.user.findUnique({ where: { id: session.user!.id } });
      if (!from?.walletAddress) throw new Error("Wallet tidak siap");
      const balance = new Decimal(from.walletBalance.toString());
      if (balance.lt(amount)) throw new Error("Saldo tidak mencukupi");

      const to = await tx.user.findFirst({
        where: { walletAddress: toWallet, memberStatus: "ACTIVE" },
      });
      if (!to) throw new Error("Penerima tidak ditemukan");
      if (to.id === from.id) throw new Error("Tidak bisa transfer ke diri sendiri");

      const txId = newTransactionId("WT");

      await tx.user.update({
        where: { id: from.id },
        data: { walletBalance: balance.minus(amount) },
      });
      await tx.user.update({
        where: { id: to.id },
        data: { walletBalance: new Decimal(to.walletBalance.toString()).plus(amount) },
      });
      await tx.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: from.id,
          toUserId: to.id,
          amount,
          note: body.note ? String(body.note).slice(0, 200) : null,
        },
      });

      return { transactionId: txId };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal transfer";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
