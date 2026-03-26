-- CreateTable
CREATE TABLE "MemberFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberFollow_followerId_followingId_key" ON "MemberFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "MemberFollow_followingId_idx" ON "MemberFollow"("followingId");

-- CreateIndex
CREATE INDEX "MemberFollow_followerId_idx" ON "MemberFollow"("followerId");

-- AddForeignKey
ALTER TABLE "MemberFollow" ADD CONSTRAINT "MemberFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberFollow" ADD CONSTRAINT "MemberFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
