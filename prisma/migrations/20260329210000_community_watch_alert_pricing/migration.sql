-- AlterTable
ALTER TABLE "MtCommunityPublishedAccount" ADD COLUMN "watchAlertFree" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MtCommunityPublishedAccount" ADD COLUMN "watchAlertPriceIdr" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MtCommunityActivityWatch" ADD COLUMN "paidAmountIdr" DECIMAL(18,2) NOT NULL DEFAULT 0;
