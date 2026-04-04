-- Tambah nilai WITHDRAW ke enum OtpPurpose
ALTER TYPE "OtpPurpose" ADD VALUE IF NOT EXISTS 'WITHDRAW';
