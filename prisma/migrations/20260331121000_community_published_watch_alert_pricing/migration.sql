-- Kolom alert "Ikuti" pada akun komunitas (tabel dibuat di 20260331120000_community_copy_trade).
-- Dipisahkan dari 20260329210000 karena timestamp lama menjalankan ALTER sebelum CREATE TABLE.
ALTER TABLE "MtCommunityPublishedAccount" ADD COLUMN IF NOT EXISTS "watchAlertFree" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MtCommunityPublishedAccount" ADD COLUMN IF NOT EXISTS "watchAlertPriceIdr" DECIMAL(18,2) NOT NULL DEFAULT 0;
