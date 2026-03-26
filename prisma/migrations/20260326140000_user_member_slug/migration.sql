-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "memberSlug" TEXT;

-- CreateIndex (unik, boleh banyak NULL di Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "User_memberSlug_key" ON "User"("memberSlug");
