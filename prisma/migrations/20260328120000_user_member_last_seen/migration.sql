-- Aktivitas terakhir member (untuk daftar "online" di admin).
ALTER TABLE "User" ADD COLUMN "memberLastSeenAt" TIMESTAMP(3);

CREATE INDEX "User_memberLastSeenAt_idx" ON "User"("memberLastSeenAt");
