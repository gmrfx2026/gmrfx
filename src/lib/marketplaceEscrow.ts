import { prisma } from "@/lib/prisma";
import {
  MarketplaceEscrowProductType,
  MarketplaceEscrowStatus,
  Prisma,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export const ESCROW_WALLET_NOTE_PREFIX = "[Dana ditahan escrow]";
export const MARKETPLACE_ESCROW_DAYS_KEY = "marketplace_escrow_days";

export async function getMarketplaceEscrowDays(): Promise<number> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: MARKETPLACE_ESCROW_DAYS_KEY },
  });
  const n = Number.parseInt(String(row?.value ?? "3"), 10);
  if (!Number.isFinite(n) || n < 1 || n > 30) return 3;
  return n;
}

export function computeEscrowReleaseAt(days: number): Date {
  return new Date(Date.now() + days * 86400 * 1000);
}

type Tx = Prisma.TransactionClient;

export async function openMarketplaceEscrowDisputeTx(
  tx: Tx,
  holdId: string,
  buyerId: string,
  reason: string
): Promise<void> {
  const reasonTrim = String(reason ?? "").trim();
  if (reasonTrim.length < 10) {
    throw new Error("Alasan komplain minimal 10 karakter");
  }

  const locked = await tx.marketplaceEscrowHold.updateMany({
    where: {
      id: holdId,
      buyerId,
      status: MarketplaceEscrowStatus.PENDING,
    },
    data: {
      status: MarketplaceEscrowStatus.DISPUTED,
      disputeReason: reasonTrim.slice(0, 5000),
    },
  });
  if (locked.count !== 1) {
    throw new Error("Komplain tidak dapat diajukan");
  }
}

export async function releaseEscrowToSellerTx(
  tx: Tx,
  holdId: string,
  opts?: { forceBeforeReleaseAt?: boolean; allowDisputed?: boolean }
): Promise<void> {
  const hold = await tx.marketplaceEscrowHold.findUnique({ where: { id: holdId } });
  if (!hold) {
    throw new Error("Escrow tidak dapat dicairkan");
  }

  const isPending = hold.status === MarketplaceEscrowStatus.PENDING;
  const isDisputed = hold.status === MarketplaceEscrowStatus.DISPUTED;

  if (isPending) {
    if (!opts?.forceBeforeReleaseAt && hold.releaseAt.getTime() > Date.now()) {
      throw new Error("Belum waktu pencairan escrow");
    }
  } else if (isDisputed) {
    if (!opts?.allowDisputed) {
      throw new Error("Escrow dalam sengketa — hanya admin yang dapat mencairkan");
    }
  } else {
    throw new Error("Escrow tidak dapat dicairkan");
  }

  const locked = isDisputed
    ? await tx.marketplaceEscrowHold.updateMany({
        where: { id: holdId, status: MarketplaceEscrowStatus.DISPUTED },
        data: {
          status: MarketplaceEscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      })
    : await tx.marketplaceEscrowHold.updateMany({
        where: { id: holdId, status: MarketplaceEscrowStatus.PENDING },
        data: {
          status: MarketplaceEscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      });
  if (locked.count !== 1) {
    throw new Error("Escrow sudah diproses");
  }

  const seller = await tx.user.findUnique({ where: { id: hold.sellerId } });
  if (!seller) throw new Error("Penjual tidak ditemukan");
  const amount = new Decimal(hold.amount.toString());
  await tx.user.update({
    where: { id: hold.sellerId },
    data: {
      walletBalance: new Decimal(seller.walletBalance.toString()).plus(amount),
    },
  });
}

export async function refundMarketplaceEscrowTx(
  tx: Tx,
  holdId: string,
  adminNote: string | null
): Promise<void> {
  const hold = await tx.marketplaceEscrowHold.findUnique({ where: { id: holdId } });
  if (
    !hold ||
    (hold.status !== MarketplaceEscrowStatus.PENDING &&
      hold.status !== MarketplaceEscrowStatus.DISPUTED)
  ) {
    throw new Error("Escrow tidak dapat dikembalikan");
  }

  const locked = await tx.marketplaceEscrowHold.updateMany({
    where: {
      id: holdId,
      status: { in: [MarketplaceEscrowStatus.PENDING, MarketplaceEscrowStatus.DISPUTED] },
    },
    data: {
      status: MarketplaceEscrowStatus.REFUNDED,
      refundedAt: new Date(),
      adminNote:
        adminNote != null && String(adminNote).trim()
          ? String(adminNote).trim().slice(0, 2000)
          : hold.adminNote,
    },
  });
  if (locked.count !== 1) throw new Error("Escrow sudah diproses");

  const buyer = await tx.user.findUnique({ where: { id: hold.buyerId } });
  if (!buyer) throw new Error("Pembeli tidak ditemukan");
  const amount = new Decimal(hold.amount.toString());
  await tx.user.update({
    where: { id: hold.buyerId },
    data: {
      walletBalance: new Decimal(buyer.walletBalance.toString()).plus(amount),
    },
  });

  if (hold.indicatorPurchaseId) {
    await tx.indicatorPurchase.deleteMany({ where: { id: hold.indicatorPurchaseId } });
  }
  if (hold.eaPurchaseId) {
    await tx.expertAdvisorPurchase.deleteMany({ where: { id: hold.eaPurchaseId } });
  }

  await tx.walletTransfer.update({
    where: { id: hold.walletTransferId },
    data: { cancelledAt: new Date() },
  });
}

export async function processDueMarketplaceEscrowReleases(): Promise<{ released: number }> {
  const now = new Date();
  const due = await prisma.marketplaceEscrowHold.findMany({
    where: {
      status: MarketplaceEscrowStatus.PENDING,
      releaseAt: { lte: now },
    },
    select: { id: true },
  });

  let released = 0;
  for (const d of due) {
    try {
      await prisma.$transaction(async (tx) => {
        await releaseEscrowToSellerTx(tx, d.id);
      });
      released += 1;
    } catch {
      /* race / already released */
    }
  }
  return { released };
}
