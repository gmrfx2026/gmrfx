-- AlterTable
ALTER TABLE "MtDeal" ADD COLUMN "positionId" TEXT,
ADD COLUMN "positionOpenTime" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MtDeal_userId_mtLogin_positionId_idx" ON "MtDeal"("userId", "mtLogin", "positionId");
