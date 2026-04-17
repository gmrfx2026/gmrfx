import { ARTICLE_IMAGE_SRC_RE, NEWS_IMAGE_LOOSE_SRC_RE, NEWS_IMAGE_SRC_RE } from "@/lib/articleImagePolicy";

/** Sampul indikator yang diunggah admin/member (path lokal). */
const UPLOADS_INDICATOR_COVER_RE =
  /^\/uploads\/indicator-covers\/[a-z0-9]+\.(jpg|jpeg|png|webp)$/i;

/** Nama file = userId + ekstensi (cuid, uuid, dll. — boleh mengandung tanda hubung). */
const UPLOADS_AVATAR_RE =
  /^\/uploads\/avatars\/[a-z0-9][a-z0-9._-]{0,200}\.(jpg|jpeg|png|webp)$/i;

const PUBLIC_FILE_PREFIX = /^\/api\/public-file\//i;

/**
 * Mengarahkan `/uploads/...` yang dilayani Next ke `/api/public-file/...` agar file tetap terbaca
 * saat nginx tidak mem-proxy folder static `public/uploads`.
 *
 * Mendukung URL absolut ke domain sendiri, mis. `https://gmrfx.app/uploads/news-images/...`.
 */
export function resolvePublicDisplayUrl(src: string | null | undefined): string | null {
  const s = src?.trim();
  if (!s) return null;

  let pathOnly: string;
  let queryAndHash = "";
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      pathOnly = u.pathname;
      queryAndHash = `${u.search}${u.hash}`;
    } catch {
      return s;
    }
  } else {
    const idx = s.search(/[?#]/);
    if (idx >= 0) {
      pathOnly = s.slice(0, idx).trim();
      queryAndHash = s.slice(idx);
    } else {
      pathOnly = s.trim();
    }
  }

  if (PUBLIC_FILE_PREFIX.test(pathOnly)) {
    return `${pathOnly}${queryAndHash}`;
  }

  if (
    NEWS_IMAGE_SRC_RE.test(pathOnly) ||
    NEWS_IMAGE_LOOSE_SRC_RE.test(pathOnly) ||
    ARTICLE_IMAGE_SRC_RE.test(pathOnly) ||
    UPLOADS_AVATAR_RE.test(pathOnly) ||
    UPLOADS_INDICATOR_COVER_RE.test(pathOnly)
  ) {
    const tail = pathOnly.replace(/^\/uploads\//i, "");
    return `/api/public-file/${tail}${queryAndHash}`;
  }

  if (/^https?:\/\//i.test(s)) {
    return s;
  }

  return s;
}
