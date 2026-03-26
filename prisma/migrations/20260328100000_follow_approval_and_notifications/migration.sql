-- CreateEnum
CREATE TYPE "FollowApprovalMode" AS ENUM ('AUTO', 'APPROVAL_REQUIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "followApprovalMode" "FollowApprovalMode" NOT NULL DEFAULT 'AUTO';

-- CreateEnum
CREATE TYPE "MemberFollowStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "MemberFollow" ADD COLUMN "status" "MemberFollowStatus" NOT NULL DEFAULT 'ACCEPTED';
ALTER TABLE "MemberFollow" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "MemberFollow" SET "updatedAt" = "createdAt";

-- CreateIndex
CREATE INDEX "MemberFollow_followingId_status_idx" ON "MemberFollow"("followingId", "status");

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW_REQUEST', 'FOLLOW_ACCEPTED', 'NEW_STATUS', 'NEW_ARTICLE');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "statusId" TEXT,
    "articleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
