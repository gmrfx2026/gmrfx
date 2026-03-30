-- CreateEnum
CREATE TYPE "HomeNewsScope" AS ENUM ('DOMESTIC', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "HomeNewsStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "HomeNewsItem" (
    "id" TEXT NOT NULL,
    "scope" "HomeNewsScope" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "contentHtml" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "status" "HomeNewsStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeNewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeNewsItem_slug_key" ON "HomeNewsItem"("slug");

-- CreateIndex
CREATE INDEX "HomeNewsItem_scope_status_publishedAt_idx" ON "HomeNewsItem"("scope", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "HomeNewsItem_scope_sourceUrl_idx" ON "HomeNewsItem"("scope", "sourceUrl");
