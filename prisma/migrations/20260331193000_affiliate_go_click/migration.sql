-- CreateTable
CREATE TABLE "AffiliateGoClick" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorId" TEXT,
    "referer" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AffiliateGoClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateGoClick_createdAt_idx" ON "AffiliateGoClick"("createdAt");
