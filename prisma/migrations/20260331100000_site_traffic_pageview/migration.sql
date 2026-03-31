-- CreateTable
CREATE TABLE "SiteTrafficPageview" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorId" VARCHAR(64) NOT NULL,
    "path" VARCHAR(2048) NOT NULL,
    "referrer" VARCHAR(2048),
    "referrerHost" VARCHAR(256),
    "utmSource" VARCHAR(128),
    "utmMedium" VARCHAR(128),
    "utmCampaign" VARCHAR(256),
    "entryType" VARCHAR(32) NOT NULL,

    CONSTRAINT "SiteTrafficPageview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteTrafficPageview_createdAt_idx" ON "SiteTrafficPageview"("createdAt");

-- CreateIndex
CREATE INDEX "SiteTrafficPageview_visitorId_createdAt_idx" ON "SiteTrafficPageview"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "SiteTrafficPageview_entryType_idx" ON "SiteTrafficPageview"("entryType");

-- CreateIndex
CREATE INDEX "SiteTrafficPageview_referrerHost_idx" ON "SiteTrafficPageview"("referrerHost");
