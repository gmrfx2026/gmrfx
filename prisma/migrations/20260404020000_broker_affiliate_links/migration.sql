-- CreateTable
CREATE TABLE "BrokerAffiliateLink" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "logoUrl" VARCHAR(2048),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerAffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokerAffiliateLink_active_sortOrder_idx" ON "BrokerAffiliateLink"("active", "sortOrder");

-- Seed: pindahkan 2 link hardcode menjadi data database
INSERT INTO "BrokerAffiliateLink" ("id", "name", "url", "sortOrder", "active", "createdAt", "updatedAt") VALUES
  ('broker-exness-001', 'Exness', 'https://one.exnessonelink.com/a/uf4nmv8e', 0, true, NOW(), NOW()),
  ('broker-tickmill-001', 'Tickmill', 'https://tickmill.link/3PNO32X', 1, true, NOW(), NOW());
