import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { newTransactionId } from "@/lib/txid";
import { MarketplaceEscrowProductType } from "@prisma/client";
import {
  computeEscrowReleaseAt,
  ESCROW_WALLET_NOTE_PREFIX,
  getMarketplaceEscrowDays,
} from "@/lib/marketplaceEscrow";
import {
  createIndicatorMtLicenseTx,
  normalizeMtLicenseProductCode,
} from "@/lib/indicatorLicense";

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

  const escrowDays = await getMarketplaceEscrowDays();
  const releaseAt = computeEscrowReleaseAt(escrowDays);

  try {
    await prisma.$transaction(async (tx) => {
      const ind = await tx.sharedIndicator.findUnique({
        where: { id: indicatorId },
        select: {
          id: true,
          title: true,
          sellerId: true,
          published: true,
          priceIdr: true,
          mtLicenseProductCode: true,
          mtLicenseValidityDays: true,
        },
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

      const buyer = await tx.user.findUnique({
        where: { id: buyerId },
        select: { walletAddress: true, email: true, walletBalance: true },
      });
      if (!buyer?.walletAddress) {
        throw new Error("Lengkapi alamat wallet di profil untuk membeli");
      }

      const bal = new Decimal(buyer.walletBalance.toString());
      if (bal.lt(price)) {
        throw new Error("Saldo wallet IDR tidak mencukupi");
      }

      const seller = await tx.user.findUnique({ where: { id: ind.sellerId } });
      if (!seller) throw new Error("Penjual tidak ditemukan");

      const purchase = await tx.indicatorPurchase.create({
        data: {
          indicatorId,
          buyerId,
          amountIdr: price,
        },
      });

      const productCode = normalizeMtLicenseProductCode(ind.mtLicenseProductCode);
      if (productCode) {
        const rawDays = ind.mtLicenseValidityDays;
        const validityDays =
          rawDays != null && rawDays >= 1 ? Math.min(3650, rawDays) : 365;
        await createIndicatorMtLicenseTx(tx, {
          purchaseId: purchase.id,
          buyerId,
          buyerEmail: buyer.email,
          indicatorId,
          productCode,
          validityDays,
        });
      }

      const txId = newTransactionId("IND");
      const wt = await tx.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: buyerId,
          toUserId: ind.sellerId,
          amount: price,
          note: `${ESCROW_WALLET_NOTE_PREFIX} Beli indikator: ${ind.title}. Dana penjual dicairkan setelah ±${escrowDays} hari jika tidak ada komplain.`,
        },
      });

      await tx.marketplaceEscrowHold.create({
        data: {
          buyerId,
          sellerId: ind.sellerId,
          amount: price,
          productType: MarketplaceEscrowProductType.INDICATOR,
          releaseAt,
          walletTransferId: wt.id,
          indicatorPurchaseId: purchase.id,
        },
      });

      await tx.user.update({
        where: { id: buyerId },
        data: { walletBalance: bal.minus(price) },
      });
    });

    return NextResponse.json({ ok: true, escrowDays, releaseAt: releaseAt.toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal memproses pembelian";
    const status =
      msg.includes("sudah membeli") || msg.includes("sendiri") || msg.includes("gratis") ? 409 : 400;
    console.error("indicator purchase", e);
    return NextResponse.json({ error: msg }, { status });
  }
}
