-- CreateTable
CREATE TABLE "MemberMenuItem" (
    "id" TEXT NOT NULL,
    "tabKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberMenuItem_tabKey_key" ON "MemberMenuItem"("tabKey");
