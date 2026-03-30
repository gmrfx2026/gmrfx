-- Widen platform for TradingView / other (indikator & EA).
ALTER TABLE "SharedIndicator" ALTER COLUMN "platform" TYPE VARCHAR(16);

ALTER TABLE "SharedExpertAdvisor" ALTER COLUMN "platform" TYPE VARCHAR(16);
