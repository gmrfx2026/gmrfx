-- CreateTable
CREATE TABLE "IndicatorRating" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EaRating" (
    "id" TEXT NOT NULL,
    "eaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EaRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorRating_indicatorId_userId_key" ON "IndicatorRating"("indicatorId", "userId");

-- CreateIndex
CREATE INDEX "IndicatorRating_indicatorId_idx" ON "IndicatorRating"("indicatorId");

-- CreateIndex
CREATE UNIQUE INDEX "EaRating_eaId_userId_key" ON "EaRating"("eaId", "userId");

-- CreateIndex
CREATE INDEX "EaRating_eaId_idx" ON "EaRating"("eaId");

-- AddForeignKey
ALTER TABLE "IndicatorRating" ADD CONSTRAINT "IndicatorRating_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "SharedIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorRating" ADD CONSTRAINT "IndicatorRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EaRating" ADD CONSTRAINT "EaRating_eaId_fkey" FOREIGN KEY ("eaId") REFERENCES "SharedExpertAdvisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EaRating" ADD CONSTRAINT "EaRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
