-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_COPY_SUB_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_WATCH_SUB_EXPIRED';

-- AlterTable
ALTER TABLE "MtCopyFollow" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MtCommunityActivityWatch" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MtCopyFollow_expiresAt_idx" ON "MtCopyFollow"("expiresAt");

-- CreateIndex
CREATE INDEX "MtCommunityActivityWatch_expiresAt_idx" ON "MtCommunityActivityWatch"("expiresAt");
