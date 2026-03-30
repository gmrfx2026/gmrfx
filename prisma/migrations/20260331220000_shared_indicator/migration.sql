-- CreateTable
CREATE TABLE "SharedIndicator" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceIdr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "platform" VARCHAR(8) NOT NULL DEFAULT 'mt5',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorPurchase" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amountIdr" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedIndicator_slug_key" ON "SharedIndicator"("slug");

-- CreateIndex
CREATE INDEX "SharedIndicator_sellerId_idx" ON "SharedIndicator"("sellerId");

-- CreateIndex
CREATE INDEX "SharedIndicator_published_idx" ON "SharedIndicator"("published");

-- CreateIndex
CREATE INDEX "IndicatorPurchase_buyerId_idx" ON "IndicatorPurchase"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorPurchase_indicatorId_buyerId_key" ON "IndicatorPurchase"("indicatorId", "buyerId");

-- AddForeignKey
ALTER TABLE "SharedIndicator" ADD CONSTRAINT "SharedIndicator_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorPurchase" ADD CONSTRAINT "IndicatorPurchase_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "SharedIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorPurchase" ADD CONSTRAINT "IndicatorPurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
