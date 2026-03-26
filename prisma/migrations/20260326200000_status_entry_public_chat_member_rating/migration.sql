-- StatusEntry + Comment.statusId (sebelumnya hanya statusOwnerId di init)
-- PublicChatMessage, MemberRating (ada di schema, belum pernah dimigrasi)

-- CreateTable
CREATE TABLE "StatusEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEntry_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "statusId" TEXT;

-- AddForeignKey
ALTER TABLE "StatusEntry" ADD CONSTRAINT "StatusEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PublicChatMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PublicChatMessage" ADD CONSTRAINT "PublicChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MemberRating" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberRating_memberId_raterId_key" ON "MemberRating"("memberId", "raterId");

-- AddForeignKey
ALTER TABLE "MemberRating" ADD CONSTRAINT "MemberRating_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRating" ADD CONSTRAINT "MemberRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
