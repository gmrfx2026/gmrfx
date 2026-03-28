-- AlterTable
ALTER TABLE "MtAccountSnapshot" ADD COLUMN "tradeAccountName" VARCHAR(128);
ALTER TABLE "MtAccountSnapshot" ADD COLUMN "sourcePlatform" VARCHAR(8);

-- CreateTable
CREATE TABLE "MtCommunityPublishedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mtLogin" TEXT NOT NULL,
    "allowCopy" BOOLEAN NOT NULL DEFAULT false,
    "copyFree" BOOLEAN NOT NULL DEFAULT true,
    "copyPriceIdr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "platform" VARCHAR(8) NOT NULL DEFAULT 'mt5',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MtCommunityPublishedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MtCopyFollow" (
    "id" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "publisherUserId" TEXT NOT NULL,
    "mtLogin" TEXT NOT NULL,
    "paidAmountIdr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MtCopyFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MtCommunityPublishedAccount_allowCopy_idx" ON "MtCommunityPublishedAccount"("allowCopy");

-- CreateIndex
CREATE UNIQUE INDEX "MtCommunityPublishedAccount_userId_mtLogin_key" ON "MtCommunityPublishedAccount"("userId", "mtLogin");

-- CreateIndex
CREATE INDEX "MtCopyFollow_followerUserId_idx" ON "MtCopyFollow"("followerUserId");

-- CreateIndex
CREATE INDEX "MtCopyFollow_publisherUserId_mtLogin_idx" ON "MtCopyFollow"("publisherUserId", "mtLogin");

-- CreateIndex
CREATE UNIQUE INDEX "MtCopyFollow_followerUserId_publisherUserId_mtLogin_key" ON "MtCopyFollow"("followerUserId", "publisherUserId", "mtLogin");

-- AddForeignKey
ALTER TABLE "MtCommunityPublishedAccount" ADD CONSTRAINT "MtCommunityPublishedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MtCopyFollow" ADD CONSTRAINT "MtCopyFollow_followerUserId_fkey" FOREIGN KEY ("followerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MtCopyFollow" ADD CONSTRAINT "MtCopyFollow_publisherUserId_fkey" FOREIGN KEY ("publisherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
