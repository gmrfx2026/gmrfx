-- AlterTable
ALTER TABLE "MtCommunityPublishedAccount" ADD COLUMN "allowWatch" BOOLEAN NOT NULL DEFAULT false;

-- Sebelumnya Ikuti hanya aktif jika allowCopy: pertahankan perilaku untuk baris yang sudah ada.
UPDATE "MtCommunityPublishedAccount" SET "allowWatch" = "allowCopy" WHERE "allowCopy" = true;
