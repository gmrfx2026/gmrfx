-- AlterEnum (idempotent: label bisa sudah ada dari migrasi/DB lama)
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_COPY_SUB_EXPIRED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_WATCH_SUB_EXPIRED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "MtCopyFollow" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

ALTER TABLE "MtCommunityActivityWatch" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MtCopyFollow_expiresAt_idx" ON "MtCopyFollow"("expiresAt");

CREATE INDEX IF NOT EXISTS "MtCommunityActivityWatch_expiresAt_idx" ON "MtCommunityActivityWatch"("expiresAt");
