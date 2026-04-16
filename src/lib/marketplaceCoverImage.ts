import { isIndicatorCoverId } from "@/lib/marketplaceIndicatorCoverSvgs";
import { VERCEL_BLOB_SRC_RE } from "@/lib/articleImagePolicy";
import { resolvePublicDisplayUrl } from "@/lib/publicUploadUrl";

/** Path lama (file di public) — di UI dialihkan ke /api/indikator-cover/… (banyak id baru tidak punya file di public). */
const LEGACY_INDICATOR_COVER_RE =
  /^\/indikator-assets\/covers\/([a-z0-9-]+)(?:\.(?:svg|png|jpg|jpeg|webp))?$/i;

const API_INDICATOR_COVER_RE = /^\/api\/indikator-cover\/([a-z0-9-]+)\/?$/i;

/** Samakan dengan `prisma/seed-piphunter-indicators.ts` — dipakai jika `coverImageUrl` kosong/salah. */
const PIPHUNTER_SLUG_TO_COVER_PATH: Readonly<Record<string, string>> = {
  "piphunter-rsi-sederhana-mt5": "/api/indikator-cover/rsi",
  "piphunter-alert-ma-cross-mt5": "/api/indikator-cover/ma-cross",
  "piphunter-macd-histogram-mt5": "/api/indikator-cover/macd",
  "piphunter-zona-support-resistance-mt5": "/api/indikator-cover/sr-zones",
  "piphunter-session-high-low-mt5": "/api/indikator-cover/session-hilo",
  "piphunter-bollinger-bands-mt5": "/api/indikator-cover/bollinger-bands",
  "piphunter-stochastic-mt5": "/api/indikator-cover/stochastic",
  "piphunter-atr-volatilitas-mt5": "/api/indikator-cover/atr",
  "piphunter-fibonacci-retracement-mt5": "/api/indikator-cover/fibonacci",
  "piphunter-pivot-points-mt5": "/api/indikator-cover/pivot-points",
  "piphunter-ichimoku-mt5": "/api/indikator-cover/ichimoku",
  "piphunter-cci-osilator-mt5": "/api/indikator-cover/cci",
};

/** Legacy + URL API sampul indikator PipHunter (whitelist id). */
export const MARKETPLACE_COVER_SRC_RE =
  /^(\/indikator-assets\/covers\/[a-z0-9-]+(?:\.(?:svg|png|jpg|jpeg|webp))?|\/api\/indikator-cover\/[a-z0-9-]+\/?)$/i;

function pathnameForCoverSrc(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    try {
      const p = new URL(t).pathname;
      return p.replace(/\/+$/, "") || null;
    } catch {
      return null;
    }
  }
  const noQuery = t.split(/[?#]/)[0] ?? t;
  return noQuery.replace(/\/+$/, "") || null;
}

function resolveCoverFromPathname(path: string | null): string | null {
  if (!path) return null;

  if (/\/api\/public-file\/indicator-covers\/[a-z0-9]+\.(?:jpg|jpeg|png|webp)$/i.test(path)) {
    return path;
  }
  if (/\/uploads\/indicator-covers\/[a-z0-9]+\.(?:jpg|jpeg|png|webp)$/i.test(path)) {
    return resolvePublicDisplayUrl(path) ?? path;
  }

  const legacy = LEGACY_INDICATOR_COVER_RE.exec(path);
  if (legacy) {
    const base = legacy[1].toLowerCase();
    return isIndicatorCoverId(base) ? `/api/indikator-cover/${base}` : null;
  }

  const api = API_INDICATOR_COVER_RE.exec(path);
  if (api && isIndicatorCoverId(api[1])) {
    return `/api/indikator-cover/${api[1].toLowerCase()}`;
  }

  return null;
}

export function isAllowedMarketplaceCoverSrc(src: string | null | undefined): boolean {
  return resolveMarketplaceIndicatorCoverUrl(src) != null;
}

/**
 * URL final untuk atribut img src: path legacy `/indikator-assets/...` dialihkan ke `/api/indikator-cover/{id}`
 * agar sampul tidak bergantung file di `public/`. Mendukung URL absolut ke domain sendiri.
 * `slug` opsional: fallback untuk seed PipHunter jika kolom DB kosong atau tidak dikenali.
 */
export function resolveMarketplaceIndicatorCoverUrl(
  src: string | null | undefined,
  slug?: string | null
): string | null {
  const raw = src?.trim();
  if (!raw) return null;
  if (VERCEL_BLOB_SRC_RE.test(raw)) return raw;

  const path = pathnameForCoverSrc(raw);
  const fromSrc = resolveCoverFromPathname(path);
  if (fromSrc) return fromSrc;

  if (slug) {
    const fallbackPath = PIPHUNTER_SLUG_TO_COVER_PATH[slug];
    if (fallbackPath) {
      const fromSlug = resolveCoverFromPathname(fallbackPath);
      if (fromSlug) return fromSlug;
    }
  }

  return null;
}
