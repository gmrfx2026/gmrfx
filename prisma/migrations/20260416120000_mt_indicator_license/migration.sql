-- Lisensi indikator MT (GMRFX_ZZ dll): key per pembelian, masa berlaku, verifikasi via API.

ALTER TABLE "SharedIndicator" ADD COLUMN "mtLicenseProductCode" VARCHAR(64);
ALTER TABLE "SharedIndicator" ADD COLUMN "mtLicenseValidityDays" INTEGER;

CREATE TABLE "MtIndicatorLicense" (
    "id" TEXT NOT NULL,
    "productCode" VARCHAR(64) NOT NULL,
    "licenseKeyHash" TEXT NOT NULL,
    "licenseKeyCipher" TEXT NOT NULL,
    "licenseKeyHint" VARCHAR(32) NOT NULL,
    "emailNormalized" VARCHAR(320) NOT NULL,
    "userId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MtIndicatorLicense_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MtIndicatorLicense_licenseKeyHash_key" ON "MtIndicatorLicense"("licenseKeyHash");
CREATE UNIQUE INDEX "MtIndicatorLicense_purchaseId_key" ON "MtIndicatorLicense"("purchaseId");
CREATE INDEX "MtIndicatorLicense_userId_productCode_idx" ON "MtIndicatorLicense"("userId", "productCode");
CREATE INDEX "MtIndicatorLicense_indicatorId_idx" ON "MtIndicatorLicense"("indicatorId");
CREATE INDEX "MtIndicatorLicense_productCode_idx" ON "MtIndicatorLicense"("productCode");

ALTER TABLE "MtIndicatorLicense" ADD CONSTRAINT "MtIndicatorLicense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MtIndicatorLicense" ADD CONSTRAINT "MtIndicatorLicense_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "SharedIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MtIndicatorLicense" ADD CONSTRAINT "MtIndicatorLicense_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "IndicatorPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
