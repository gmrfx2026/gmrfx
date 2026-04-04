-- CreateTable: WithdrawBankOption
CREATE TABLE IF NOT EXISTS "WithdrawBankOption" (
  "id"        TEXT         NOT NULL,
  "code"      VARCHAR(20)  NOT NULL,
  "fullName"  VARCHAR(100) NOT NULL,
  "active"    BOOLEAN      NOT NULL DEFAULT true,
  "sortOrder" INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WithdrawBankOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WithdrawBankOption_code_key" ON "WithdrawBankOption"("code");
CREATE INDEX IF NOT EXISTS "WithdrawBankOption_active_sortOrder_idx" ON "WithdrawBankOption"("active","sortOrder");

-- CreateTable: WithdrawConfig
CREATE TABLE IF NOT EXISTS "WithdrawConfig" (
  "id"               TEXT         NOT NULL DEFAULT 'default',
  "withdrawEnabled"  BOOLEAN      NOT NULL DEFAULT true,
  "bankEnabled"      BOOLEAN      NOT NULL DEFAULT true,
  "usdtEnabled"      BOOLEAN      NOT NULL DEFAULT true,
  "minAmountIdr"     INTEGER      NOT NULL DEFAULT 50000,
  "maxAmountIdr"     INTEGER      NOT NULL DEFAULT 0,
  "bankFeeIdr"       INTEGER      NOT NULL DEFAULT 0,
  "usdtFeeIdr"       INTEGER      NOT NULL DEFAULT 0,
  "usdtNetwork"      VARCHAR(50)  NOT NULL DEFAULT 'BSC (BEP-20)',
  "processingNote"   VARCHAR(500),
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WithdrawConfig_pkey" PRIMARY KEY ("id")
);

-- Seed default banks
INSERT INTO "WithdrawBankOption" ("id","code","fullName","sortOrder","active","createdAt","updatedAt") VALUES
  ('bank-bca',     'BCA',     'Bank Central Asia',        0, true, NOW(), NOW()),
  ('bank-bni',     'BNI',     'Bank Negara Indonesia',    1, true, NOW(), NOW()),
  ('bank-mandiri', 'MANDIRI', 'Bank Mandiri',             2, true, NOW(), NOW()),
  ('bank-bri',     'BRI',     'Bank Rakyat Indonesia',    3, true, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Seed default config
INSERT INTO "WithdrawConfig" ("id","withdrawEnabled","bankEnabled","usdtEnabled","minAmountIdr","maxAmountIdr","bankFeeIdr","usdtFeeIdr","usdtNetwork","processingNote","updatedAt")
VALUES ('default', true, true, true, 50000, 0, 0, 0, 'BSC (BEP-20)', NULL, NOW())
ON CONFLICT ("id") DO NOTHING;
