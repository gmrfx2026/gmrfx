import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { newTransactionId } from "@/lib/txid";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buyerId = session.user.id;
  const { id: indicatorId } = await ctx.params;
  if (!indicatorId) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const ind = await tx.sharedIndicator.findUnique({
        where: { id: indicatorId },
      });

      if (!ind || !ind.published) {
        throw new Error("Indikator tidak tersedia");
      }

      if (ind.sellerId === buyerId) {
        throw new Error("Ini indikator Anda sendiri");
      }

      const price = new Decimal(ind.priceIdr.toString());
      if (price.lte(0)) {
        throw new Error("Indikator ini gratis — unduh langsung tanpa membeli");
      }

      const dup = await tx.indicatorPurchase.findUnique({
        where: {
          indicatorId_buyerId: { indicatorId, buyerId },
        },
      });
      if (dup) {
        throw new Error("Anda sudah membeli indikator ini");
      }

      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer?.walletAddress) {
        throw new Error("Lengkapi alamat wallet di profil untuk membeli");
      }

      const bal = new Decimal(buyer.walletBalance.toString());
      if (bal.lt(price)) {
        throw new Error("Saldo wallet IDR tidak mencukupi");
      }

      const seller = await tx.user.findUnique({ where: { id: ind.sellerId } });
      if (!seller) throw new Error("Penjual tidak ditemukan");

      const txId = newTransactionId("IND");
      await tx.user.update({
        where: { id: buyerId },
        data: { walletBalance: bal.minus(price) },
      });
      await tx.user.update({
        where: { id: ind.sellerId },
        data: {
          walletBalance: new Decimal(seller.walletBalance.toString()).plus(price),
        },
      });
      await tx.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: buyerId,
          toUserId: ind.sellerId,
          amount: price,
          note: `Beli indikator: ${ind.title}`,
        },
      });
      await tx.indicatorPurchase.create({
        data: {
          indicatorId,
          buyerId,
          amountIdr: price,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memproses pembelian";
    const status =
      msg.includes("sudah membeli") || msg.includes("sendiri") || msg.includes("gratis") ? 409 : 400;
    console.error("indicator purchase", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
