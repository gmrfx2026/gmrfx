/** Tampilkan strip "Member baru" di beranda (`HomePageContent`). Nilai: "1" / "0". Default = tampil jika belum diset. */
export const HOME_MEMBER_TICKER_VISIBLE_KEY = "home_member_ticker_visible";

/** Blok berita dalam negeri di beranda. Default = tampil. */
export const HOME_NEWS_DOMESTIC_VISIBLE_KEY = "home_news_domestic_visible";

/** Blok berita internasional di beranda. Default = tampil. */
export const HOME_NEWS_INTERNATIONAL_VISIBLE_KEY = "home_news_international_visible";

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
