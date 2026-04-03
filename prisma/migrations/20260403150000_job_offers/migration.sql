-- CreateEnum
CREATE TYPE "JobOfferStatus" AS ENUM ('OPEN', 'ASSIGNED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "JobBidStatus" AS ENUM ('PENDING', 'SELECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('EA', 'INDICATOR', 'OTHER');

-- CreateTable
CREATE TABLE "JobOffer" (
    "id"            TEXT NOT NULL,
    "title"         VARCHAR(200) NOT NULL,
    "description"   TEXT NOT NULL,
    "category"      "JobCategory" NOT NULL,
    "budgetIdr"     DECIMAL(18,2) NOT NULL,
    "status"        "JobOfferStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt"     TIMESTAMP(3) NOT NULL,
    "requesterId"   TEXT NOT NULL,
    "winnerId"      TEXT,
    "deliveredAt"   TIMESTAMP(3),
    "autoReleaseAt" TIMESTAMP(3),
    "completedAt"   TIMESTAMP(3),
    "disputeReason" VARCHAR(1000),
    "adminNote"     VARCHAR(1000),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobBid" (
    "id"        TEXT NOT NULL,
    "jobId"     TEXT NOT NULL,
    "bidderId"  TEXT NOT NULL,
    "priceIdr"  DECIMAL(18,2) NOT NULL,
    "message"   VARCHAR(1000) NOT NULL,
    "status"    "JobBidStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobComment" (
    "id"        TEXT NOT NULL,
    "jobId"     TEXT NOT NULL,
    "authorId"  TEXT NOT NULL,
    "content"   VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDeliverable" (
    "id"           TEXT NOT NULL,
    "jobId"        TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName"     VARCHAR(255) NOT NULL,
    "fileUrl"      VARCHAR(1000) NOT NULL,
    "note"         VARCHAR(500),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobOffer_status_expiresAt_idx"     ON "JobOffer"("status", "expiresAt");
CREATE INDEX "JobOffer_status_autoReleaseAt_idx"  ON "JobOffer"("status", "autoReleaseAt");
CREATE INDEX "JobOffer_requesterId_idx"           ON "JobOffer"("requesterId");
CREATE INDEX "JobOffer_winnerId_idx"              ON "JobOffer"("winnerId");

CREATE UNIQUE INDEX "JobBid_jobId_bidderId_key"   ON "JobBid"("jobId", "bidderId");
CREATE INDEX "JobBid_jobId_idx"                   ON "JobBid"("jobId");
CREATE INDEX "JobBid_bidderId_idx"                ON "JobBid"("bidderId");

CREATE INDEX "JobComment_jobId_createdAt_idx"     ON "JobComment"("jobId", "createdAt");

CREATE INDEX "JobDeliverable_jobId_idx"           ON "JobDeliverable"("jobId");

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_winnerId_fkey"
    FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JobBid" ADD CONSTRAINT "JobBid_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobBid" ADD CONSTRAINT "JobBid_bidderId_fkey"
    FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobComment" ADD CONSTRAINT "JobComment_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobDeliverable" ADD CONSTRAINT "JobDeliverable_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "JobOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobDeliverable" ADD CONSTRAINT "JobDeliverable_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
