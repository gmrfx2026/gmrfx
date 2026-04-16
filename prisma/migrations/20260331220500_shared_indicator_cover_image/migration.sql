-- AlterTable (idempotent: kolom bisa sudah ada dari migrasi/DB lama)
ALTER TABLE "SharedIndicator" ADD COLUMN IF NOT EXISTS "coverImageUrl" VARCHAR(1024);
