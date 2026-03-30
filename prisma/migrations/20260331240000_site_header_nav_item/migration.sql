-- CreateTable
CREATE TABLE "SiteHeaderNavItem" (
    "id" TEXT NOT NULL,
    "navKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteHeaderNavItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteHeaderNavItem_navKey_key" ON "SiteHeaderNavItem"("navKey");
