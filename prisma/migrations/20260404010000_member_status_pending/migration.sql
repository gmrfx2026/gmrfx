-- Add PENDING to MemberStatus enum
ALTER TYPE "MemberStatus" ADD VALUE IF NOT EXISTS 'PENDING';
