import { ARTICLE_IMAGE_SRC_RE, NEWS_IMAGE_SRC_RE } from "@/lib/articleImagePolicy";

/** Sampul indikator yang diunggah admin/member (path lokal). */
const UPLOADS_INDICATOR_COVER_RE =
  /^\/uploads\/indicator-covers\/[a-z0-9]+\.(jpg|jpeg|png|webp)$/i;

const UPLOADS_AVATAR_RE = /^\/uploads\/avatars\/[a-z0-9]+\.(jpg|jpeg|png|webp)$/i;

const PUBLIC_FILE_PREFIX = /^\/api\/public-file\//i;

/**
 * Mengarahkan `/uploads/...` yang dilayani Next ke `/api/public-file/...` agar file tetap terbaca
 * saat nginx tidak mem-proxy folder static `public/uploads`.
 */
export function resolvePublicDisplayUrl(src: string | null | undefined): string | null {
  const s = src?.trim();
  if (!s) return null;
  if (PUBLIC_FILE_PREFIX.test(s)) return s;
  if (
    NEWS_IMAGE_SRC_RE.test(s) ||
    ARTICLE_IMAGE_SRC_RE.test(s) ||
    UPLOADS_AVATAR_RE.test(s) ||
    UPLOADS_INDICATOR_COVER_RE.test(s)
  ) {
    const tail = s.replace(/^\/uploads\//i, "");
    return `/api/public-file/${tail}`;
  }
  return s;
}
