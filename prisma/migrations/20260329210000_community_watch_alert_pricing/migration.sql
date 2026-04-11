-- Hanya MtCommunityActivityWatch. Kolom harga alert "Ikuti" pada akun publish komunitas
-- ada di migrasi 20260331121000 (setelah CREATE TABLE di 20260331120000).

-- AlterTable
ALTER TABLE "MtCommunityActivityWatch" ADD COLUMN IF NOT EXISTS "paidAmountIdr" DECIMAL(18,2) NOT NULL DEFAULT 0;
