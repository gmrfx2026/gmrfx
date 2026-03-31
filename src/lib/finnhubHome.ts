import { unstable_cache } from "next/cache";

/** Simbol yang diizinkan (hindari query arbitrer dari klien). */
const QUOTE_SYMBOLS = [
  { symbol: "OANDA:EUR_USD", label: "EUR/USD" },
  { symbol: "OANDA:GBP_USD", label: "GBP/USD" },
  { symbol: "OANDA:USD_JPY", label: "USD/JPY" },
  { symbol: "OANDA:XAU_USD", label: "XAU/USD" },
  { symbol: "BINANCE:BTCUSDT", label: "BTC/USDT" },
] as const;

export type FinnhubQuoteRow = {
  label: string;
  symbol: string;
  current: number | null;
  change: number | null;
  changePercent: number | null;
};

export type FinnhubNewsRow = {
  id: number;
  headline: string;
  url: string;
  source: string;
  datetime: number;
};

export type FinnhubHomePayload = {
  quotes: FinnhubQuoteRow[];
  news: FinnhubNewsRow[];
  fetchedAt: string;
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

async function fetchQuote(symbol: string, token: string, label: string): Promise<FinnhubQuoteRow> {
  const u = new URL("https://finnhub.io/api/v1/quote");
  u.searchParams.set("symbol", symbol);
  u.searchParams.set("token", token);
  const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    return { label, symbol, current: null, change: null, changePercent: null };
  }
  const j = (await res.json()) as Record<string, unknown>;
  if (j.error) {
    return { label, symbol, current: null, change: null, changePercent: null };
  }
  const c = num(j.c);
  const pc = num(j.pc);
  const current = c !== null && c !== 0 ? c : pc !== null && pc !== 0 ? pc : null;
  return {
    label,
    symbol,
    current,
    change: num(j.d),
    changePercent: num(j.dp),
  };
}

async function fetchForexNews(token: string, limit: number): Promise<FinnhubNewsRow[]> {
  const u = new URL("https://finnhub.io/api/v1/news");
  u.searchParams.set("category", "forex");
  u.searchParams.set("token", token);
  const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) return [];
  const out: FinnhubNewsRow[] = [];
  for (const item of raw) {
    if (out.length >= limit) break;
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "number" ? o.id : Number(o.id);
    const headline = typeof o.headline === "string" ? o.headline.trim() : "";
    const url = typeof o.url === "string" ? o.url.trim() : "";
    const source = typeof o.source === "string" ? o.source : "";
    const datetime = typeof o.datetime === "number" ? o.datetime : 0;
    if (!headline || !url || !Number.isFinite(id)) continue;
    out.push({ id, headline, url, source, datetime });
  }
  return out;
}

async function loadFinnhubHome(): Promise<FinnhubHomePayload | null> {
  const token = process.env.FINNHUB_API_KEY?.trim();
  if (!token) return null;

  const [quotes, news] = await Promise.all([
    Promise.all(QUOTE_SYMBOLS.map((s) => fetchQuote(s.symbol, token, s.label))),
    fetchForexNews(token, 5),
  ]);

  return {
    quotes,
    news,
    fetchedAt: new Date().toISOString(),
  };
}

const FINNHUB_CACHE_KEY = ["finnhub-home-v1"];
const FINNHUB_REVALIDATE_SEC = 180;

/**
 * Snapshot kutipan + berita forex untuk beranda.
 * Di-cache ±3 menit; tanpa FINNHUB_API_KEY mengembalikan null.
 */
export async function getFinnhubHomeData(): Promise<FinnhubHomePayload | null> {
  return unstable_cache(loadFinnhubHome, FINNHUB_CACHE_KEY, {
    revalidate: FINNHUB_REVALIDATE_SEC,
  })();
}
