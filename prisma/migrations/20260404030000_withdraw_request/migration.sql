-- AlterTable: tambah field bank & USDT withdraw ke User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "bankName"            VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "bankAccountNumber"   VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "bankAccountHolder"   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "usdtWithdrawAddress" VARCHAR(66);

-- CreateEnum: WithdrawMethod
DO $$ BEGIN
  CREATE TYPE "WithdrawMethod" AS ENUM ('BANK', 'USDT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: WithdrawStatus
DO $$ BEGIN
  CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable: WithdrawRequest
CREATE TABLE IF NOT EXISTS "WithdrawRequest" (
  "id"                TEXT          NOT NULL,
  "userId"            TEXT          NOT NULL,
  "amountIdr"         DECIMAL(18,2) NOT NULL,
  "method"            "WithdrawMethod" NOT NULL,
  "status"            "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
  "bankName"          VARCHAR(20),
  "bankAccountNumber" VARCHAR(30),
  "bankAccountHolder" VARCHAR(100),
  "usdtAddress"       VARCHAR(66),
  "adminNote"         TEXT,
  "processedAt"       TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3)  NOT NULL,

  CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WithdrawRequest"
  ADD CONSTRAINT "WithdrawRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WithdrawRequest_userId_createdAt_idx" ON "WithdrawRequest"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "WithdrawRequest_status_createdAt_idx" ON "WithdrawRequest"("status", "createdAt");
