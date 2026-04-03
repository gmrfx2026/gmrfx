-- CreateEnum
CREATE TYPE "UsdtDepositStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "UsdtDepositRequest" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "txHash"     VARCHAR(66) NOT NULL,
    "network"    VARCHAR(16) NOT NULL DEFAULT 'bsc',
    "amountUsdt" DECIMAL(18,6) NOT NULL,
    "rateIdr"    DECIMAL(18,2) NOT NULL,
    "amountIdr"  DECIMAL(18,2) NOT NULL,
    "status"     "UsdtDepositStatus" NOT NULL DEFAULT 'PENDING',
    "failReason" VARCHAR(512),
    "verifiedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsdtDepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsdtDepositRequest_txHash_key" ON "UsdtDepositRequest"("txHash");
CREATE INDEX "UsdtDepositRequest_userId_createdAt_idx" ON "UsdtDepositRequest"("userId", "createdAt");
CREATE INDEX "UsdtDepositRequest_status_idx" ON "UsdtDepositRequest"("status");

-- AddForeignKey
ALTER TABLE "UsdtDepositRequest" ADD CONSTRAINT "UsdtDepositRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
