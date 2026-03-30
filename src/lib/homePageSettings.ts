/** Tampilkan strip "Member baru" di beranda (`HomePageContent`). Nilai: "1" / "0". Default = tampil jika belum diset. */
export const HOME_MEMBER_TICKER_VISIBLE_KEY = "home_member_ticker_visible";

/** Blok berita dalam negeri di beranda. Default = tampil. */
export const HOME_NEWS_DOMESTIC_VISIBLE_KEY = "home_news_domestic_visible";

/** Blok berita internasional di beranda. Default = tampil. */
export const HOME_NEWS_INTERNATIONAL_VISIBLE_KEY = "home_news_international_visible";

/** Jumlah item berita per blok (dalam negeri & internasional) di beranda. Default 6, clamp 1–24. */
export const HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY = "home_news_per_block_homepage";

/** Blok katalog indikator di beranda (di atas "Artikel terbaru"). Default = tampil. */
export const HOME_INDICATORS_VISIBLE_KEY = "home_indicators_visible";

export function parseHomeNewsHomepagePerBlock(value: string | null | undefined): number {
  const n = Number.parseInt(String(value ?? "6"), 10);
  if (!Number.isFinite(n)) return 6;
  return Math.min(24, Math.max(1, n));
}

/** Kosong/tidak ada = tampil; "0"/false/no/off = sembunyikan; "1"/true/yes = tampil. */
export function isHomeSectionVisibleBySetting(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  const v = value.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return v === "1" || v === "true" || v === "yes";
}

export function isHomeMemberTickerVisible(value: string | null | undefined): boolean {
  return isHomeSectionVisibleBySetting(value);
}

export function isHomeNewsDomesticVisible(value: string | null | undefined): boolean {
  return isHomeSectionVisibleBySetting(value);
}

export function isHomeNewsInternationalVisible(value: string | null | undefined): boolean {
  return isHomeSectionVisibleBySetting(value);
}

export function isHomeIndicatorsVisible(value: string | null | undefined): boolean {
  return isHomeSectionVisibleBySetting(value);
}
