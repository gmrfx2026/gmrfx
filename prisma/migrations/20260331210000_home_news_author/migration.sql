-- AlterTable
ALTER TABLE "HomeNewsItem" ADD COLUMN "authorId" TEXT;

-- CreateIndex
CREATE INDEX "HomeNewsItem_authorId_idx" ON "HomeNewsItem"("authorId");

-- AddForeignKey
ALTER TABLE "HomeNewsItem" ADD CONSTRAINT "HomeNewsItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
