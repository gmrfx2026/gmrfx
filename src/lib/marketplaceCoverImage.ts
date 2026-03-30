import { isIndicatorCoverId } from "@/lib/marketplaceIndicatorCoverSvgs";

/** Path lama (file di public) — di UI dialihkan ke /api/indikator-cover/… */
const LEGACY_INDICATOR_COVER_RE =
  /^\/indikator-assets\/covers\/([a-z0-9-]+)\.(svg|png|jpg|jpeg|webp)$/i;

const API_INDICATOR_COVER_RE = /^\/api\/indikator-cover\/([a-z0-9-]+)$/i;

/** Legacy + URL API sampul indikator PipHunter (whitelist id). */
export const MARKETPLACE_COVER_SRC_RE =
  /^(\/indikator-assets\/covers\/[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)|\/api\/indikator-cover\/[a-z0-9-]+)$/i;

export function isAllowedMarketplaceCoverSrc(src: string | null | undefined): boolean {
  return resolveMarketplaceIndicatorCoverUrl(src) != null;
}

/** URL final untuk atribut img src (mengarahkan legacy ke API). */
export function resolveMarketplaceIndicatorCoverUrl(src: string | null | undefined): string | null {
  if (!src?.trim()) return null;
  const s = src.trim();

  const legacy = LEGACY_INDICATOR_COVER_RE.exec(s);
  if (legacy) {
    const base = legacy[1].toLowerCase();
    return isIndicatorCoverId(base) ? `/api/indikator-cover/${base}` : null;
  }

  const api = API_INDICATOR_COVER_RE.exec(s);
  if (api && isIndicatorCoverId(api[1])) {
    return `/api/indikator-cover/${api[1].toLowerCase()}`;
  }

  return null;
}
