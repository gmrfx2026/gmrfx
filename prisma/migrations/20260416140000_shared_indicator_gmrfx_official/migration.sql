-- Indikator resmi GMRFX vs katalog umum (member + admin).

ALTER TABLE "SharedIndicator" ADD COLUMN "isGmrfxOfficial" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "SharedIndicator_published_isGmrfxOfficial_idx" ON "SharedIndicator"("published", "isGmrfxOfficial");
