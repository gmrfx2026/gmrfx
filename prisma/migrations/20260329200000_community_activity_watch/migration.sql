-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COMMUNITY_MT_TRADE_ALERT';

-- CreateTable
CREATE TABLE "MtCommunityActivityWatch" (
    "id" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "publisherUserId" TEXT NOT NULL,
    "mtLogin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MtCommunityActivityWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MtCommunityActivityWatch_followerUserId_idx" ON "MtCommunityActivityWatch"("followerUserId");

-- CreateIndex
CREATE INDEX "MtCommunityActivityWatch_publisherUserId_mtLogin_idx" ON "MtCommunityActivityWatch"("publisherUserId", "mtLogin");

-- CreateIndex
CREATE UNIQUE INDEX "MtCommunityActivityWatch_followerUserId_publisherUserId_mtLogin_key" ON "MtCommunityActivityWatch"("followerUserId", "publisherUserId", "mtLogin");

-- AddForeignKey
ALTER TABLE "MtCommunityActivityWatch" ADD CONSTRAINT "MtCommunityActivityWatch_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MtCommunityActivityWatch" ADD CONSTRAINT "MtCommunityActivityWatch_publisherUserId_fkey" FOREIGN KEY ("publisherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
