-- AlterTable: tambah kolom lampiran PDF dan ubah description menjadi HTML-safe (sudah TEXT)
ALTER TABLE "JobOffer"
  ADD COLUMN "attachmentUrl"  VARCHAR(1000),
  ADD COLUMN "attachmentName" VARCHAR(255);
