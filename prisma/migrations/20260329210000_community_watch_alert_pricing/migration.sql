-- Harga/alert "Ikuti" untuk MtCommunityPublishedAccount dipindah ke 20260331121000
-- (tabel baru dibuat di 20260331120000_community_copy_trade — urutan timestamp lama salah).

-- AlterTable
ALTER TABLE "MtCommunityActivityWatch" ADD COLUMN "paidAmountIdr" DECIMAL(18,2) NOT NULL DEFAULT 0;
