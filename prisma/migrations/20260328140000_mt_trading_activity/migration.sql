-- CreateTable
CREATE TABLE "MtTradingActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mtLogin" TEXT NOT NULL,
    "positions" JSONB NOT NULL,
    "pendingOrders" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MtTradingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MtTradingActivity_userId_mtLogin_key" ON "MtTradingActivity"("userId", "mtLogin");

-- CreateIndex
CREATE INDEX "MtTradingActivity_userId_idx" ON "MtTradingActivity"("userId");

-- AddForeignKey
ALTER TABLE "MtTradingActivity" ADD CONSTRAINT "MtTradingActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
