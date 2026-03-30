/** Nilai disimpan di DB untuk indikator / EA marketplace. */
export const MARKETPLACE_PLATFORM_KEYS = ["mt4", "mt5", "tradingview", "other"] as const;

export type MarketplacePlatformKey = (typeof MARKETPLACE_PLATFORM_KEYS)[number];

const LABELS_ID: Record<MarketplacePlatformKey, string> = {
  mt4: "MetaTrader 4",
  mt5: "MetaTrader 5",
  tradingview: "TradingView",
  other: "Lainnya",
};

export function parseMarketplacePlatform(v: FormDataEntryValue | null): string {
  const s = (v == null ? "mt5" : String(v)).trim().toLowerCase();
  if ((MARKETPLACE_PLATFORM_KEYS as readonly string[]).includes(s)) return s;
  throw new Error("Platform tidak valid");
}

/** Label bahasa Indonesia untuk tampilan (termasuk data lama yang tidak dikenal). */
export function formatMarketplacePlatformLabel(platform: string): string {
  const k = platform.trim().toLowerCase();
  if ((MARKETPLACE_PLATFORM_KEYS as readonly string[]).includes(k)) {
    return LABELS_ID[k as MarketplacePlatformKey];
  }
  return platform;
}
