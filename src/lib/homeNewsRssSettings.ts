/** URL feed RSS tersimpan untuk impor cepat (Admin → Pengaturan). */
export const HOME_NEWS_RSS_DOMESTIC_URL_KEY = "home_news_rss_domestic_url";
export const HOME_NEWS_RSS_INTERNATIONAL_URL_KEY = "home_news_rss_international_url";

const MAX_LEN = 500;

export function normalizeRssFeedUrl(raw: string): string {
  return String(raw ?? "").trim().slice(0, MAX_LEN);
}

export function isValidOptionalHttpUrl(url: string): boolean {
  if (!url) return true;
  if (url.length > MAX_LEN) return false;
  return /^https?:\/\/.+/i.test(url);
}
