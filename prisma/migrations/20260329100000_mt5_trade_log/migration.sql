-- MetaTrader 5 EA: token tautan + deal historis + snapshot akun
CREATE TABLE "MtLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenHint" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "MtLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MtLinkToken_tokenHash_key" ON "MtLinkToken"("tokenHash");
CREATE INDEX "MtLinkToken_userId_idx" ON "MtLinkToken"("userId");

ALTER TABLE "MtLinkToken" ADD CONSTRAINT "MtLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MtDeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mtLogin" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "dealTime" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "dealType" INTEGER NOT NULL,
    "entryType" INTEGER NOT NULL,
    "volume" DECIMAL(18,8) NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "commission" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "swap" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "profit" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "magic" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MtDeal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MtDeal_userId_mtLogin_ticket_key" ON "MtDeal"("userId", "mtLogin", "ticket");
CREATE INDEX "MtDeal_userId_mtLogin_dealTime_idx" ON "MtDeal"("userId", "mtLogin", "dealTime");

ALTER TABLE "MtDeal" ADD CONSTRAINT "MtDeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MtAccountSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mtLogin" TEXT NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL,
    "equity" DECIMAL(18,8) NOT NULL,
    "margin" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MtAccountSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MtAccountSnapshot_userId_mtLogin_recordedAt_idx" ON "MtAccountSnapshot"("userId", "mtLogin", "recordedAt");

ALTER TABLE "MtAccountSnapshot" ADD CONSTRAINT "MtAccountSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
