-- CreateTable
CREATE TABLE "SharedExpertAdvisor" (
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

    CONSTRAINT "SharedExpertAdvisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertAdvisorPurchase" (
    "id" TEXT NOT NULL,
    "eaId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amountIdr" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertAdvisorPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedExpertAdvisor_slug_key" ON "SharedExpertAdvisor"("slug");

-- CreateIndex
CREATE INDEX "SharedExpertAdvisor_sellerId_idx" ON "SharedExpertAdvisor"("sellerId");

-- CreateIndex
CREATE INDEX "SharedExpertAdvisor_published_idx" ON "SharedExpertAdvisor"("published");

-- CreateIndex
CREATE INDEX "ExpertAdvisorPurchase_buyerId_idx" ON "ExpertAdvisorPurchase"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertAdvisorPurchase_eaId_buyerId_key" ON "ExpertAdvisorPurchase"("eaId", "buyerId");

-- AddForeignKey
ALTER TABLE "SharedExpertAdvisor" ADD CONSTRAINT "SharedExpertAdvisor_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAdvisorPurchase" ADD CONSTRAINT "ExpertAdvisorPurchase_eaId_fkey" FOREIGN KEY ("eaId") REFERENCES "SharedExpertAdvisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertAdvisorPurchase" ADD CONSTRAINT "ExpertAdvisorPurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
