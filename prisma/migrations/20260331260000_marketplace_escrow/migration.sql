-- CreateEnum
CREATE TYPE "MarketplaceEscrowStatus" AS ENUM ('PENDING', 'DISPUTED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MarketplaceEscrowProductType" AS ENUM ('INDICATOR', 'EA');

-- AlterTable
ALTER TABLE "WalletTransfer" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "IndicatorPurchase" ADD COLUMN "revokedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExpertAdvisorPurchase" ADD COLUMN "revokedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MarketplaceEscrowHold" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "productType" "MarketplaceEscrowProductType" NOT NULL,
    "status" "MarketplaceEscrowStatus" NOT NULL DEFAULT 'PENDING',
    "releaseAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "adminNote" TEXT,
    "walletTransferId" TEXT NOT NULL,
    "indicatorPurchaseId" TEXT,
    "eaPurchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceEscrowHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceEscrowHold_walletTransferId_key" ON "MarketplaceEscrowHold"("walletTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceEscrowHold_indicatorPurchaseId_key" ON "MarketplaceEscrowHold"("indicatorPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceEscrowHold_eaPurchaseId_key" ON "MarketplaceEscrowHold"("eaPurchaseId");

-- CreateIndex
CREATE INDEX "MarketplaceEscrowHold_status_releaseAt_idx" ON "MarketplaceEscrowHold"("status", "releaseAt");

-- CreateIndex
CREATE INDEX "MarketplaceEscrowHold_buyerId_status_idx" ON "MarketplaceEscrowHold"("buyerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceEscrowHold_sellerId_status_idx" ON "MarketplaceEscrowHold"("sellerId", "status");

-- AddForeignKey
ALTER TABLE "MarketplaceEscrowHold" ADD CONSTRAINT "MarketplaceEscrowHold_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEscrowHold" ADD CONSTRAINT "MarketplaceEscrowHold_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEscrowHold" ADD CONSTRAINT "MarketplaceEscrowHold_walletTransferId_fkey" FOREIGN KEY ("walletTransferId") REFERENCES "WalletTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEscrowHold" ADD CONSTRAINT "MarketplaceEscrowHold_indicatorPurchaseId_fkey" FOREIGN KEY ("indicatorPurchaseId") REFERENCES "IndicatorPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceEscrowHold" ADD CONSTRAINT "MarketplaceEscrowHold_eaPurchaseId_fkey" FOREIGN KEY ("eaPurchaseId") REFERENCES "ExpertAdvisorPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
