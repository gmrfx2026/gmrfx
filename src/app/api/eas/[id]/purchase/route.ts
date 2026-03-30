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
  const { id: eaId } = await ctx.params;
  if (!eaId) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const ea = await tx.sharedExpertAdvisor.findUnique({
        where: { id: eaId },
      });

      if (!ea || !ea.published) {
        throw new Error("EA tidak tersedia");
      }

      if (ea.sellerId === buyerId) {
        throw new Error("Ini EA Anda sendiri");
      }

      const price = new Decimal(ea.priceIdr.toString());
      if (price.lte(0)) {
        throw new Error("EA ini gratis — unduh langsung tanpa membeli");
      }

      const dup = await tx.expertAdvisorPurchase.findUnique({
        where: {
          eaId_buyerId: { eaId, buyerId },
        },
      });
      if (dup) {
        throw new Error("Anda sudah membeli EA ini");
      }

      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer?.walletAddress) {
        throw new Error("Lengkapi alamat wallet di profil untuk membeli");
      }

      const bal = new Decimal(buyer.walletBalance.toString());
      if (bal.lt(price)) {
        throw new Error("Saldo wallet IDR tidak mencukupi");
      }

      const seller = await tx.user.findUnique({ where: { id: ea.sellerId } });
      if (!seller) throw new Error("Penjual tidak ditemukan");

      const txId = newTransactionId("EA");
      await tx.user.update({
        where: { id: buyerId },
        data: { walletBalance: bal.minus(price) },
      });
      await tx.user.update({
        where: { id: ea.sellerId },
        data: {
          walletBalance: new Decimal(seller.walletBalance.toString()).plus(price),
        },
      });
      await tx.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: buyerId,
          toUserId: ea.sellerId,
          amount: price,
          note: `Beli Expert Advisor: ${ea.title}`,
        },
      });
      await tx.expertAdvisorPurchase.create({
        data: {
          eaId,
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
    console.error("ea purchase", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
