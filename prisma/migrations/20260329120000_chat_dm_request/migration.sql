-- CreateEnum
CREATE TYPE "ChatDmRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_DM_REQUEST';

-- CreateTable
CREATE TABLE "ChatDmRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "ChatDmRequestStatus" NOT NULL DEFAULT 'PENDING',
    "introMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ChatDmRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatDmRequest_requesterId_targetId_key" ON "ChatDmRequest"("requesterId", "targetId");

-- CreateIndex
CREATE INDEX "ChatDmRequest_targetId_status_idx" ON "ChatDmRequest"("targetId", "status");

-- AddForeignKey
ALTER TABLE "ChatDmRequest" ADD CONSTRAINT "ChatDmRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatDmRequest" ADD CONSTRAINT "ChatDmRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
