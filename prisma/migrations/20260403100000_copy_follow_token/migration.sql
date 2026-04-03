-- AlterTable: tambah kolom token unik per langganan copy trade
ALTER TABLE "MtCopyFollow"
  ADD COLUMN "copyTokenHash"     TEXT,
  ADD COLUMN "copyTokenHint"     TEXT,
  ADD COLUMN "copyTokenIssuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "MtCopyFollow_copyTokenHash_key" ON "MtCopyFollow"("copyTokenHash");
CREATE INDEX "MtCopyFollow_copyTokenHash_idx" ON "MtCopyFollow"("copyTokenHash");
