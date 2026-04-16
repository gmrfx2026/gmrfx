import { resolvePublicDisplayUrl } from "@/lib/publicUploadUrl";
import { upgradeRemoteImageUrl } from "@/lib/upgradeRemoteImageUrl";

/** Src gambar pertama (mendukung atribut acak di <img …>). */
const FIRST_IMG_SRC = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i;

function firstImgSrcFromHtml(html: string): string | null {
  const m = FIRST_IMG_SRC.exec(html);
  const s = m?.[1]?.trim();
  if (s) return s;
  const lazy = html.match(/<img\b[^>]*\bdata-src\s*=\s*["']([^"']+)["']/i);
  return lazy?.[1]?.trim() || null;
}

function isDataUrl(s: string): boolean {
  return s.toLowerCase().startsWith("data:");
}

function isHttpsUrl(s: string): boolean {
  return /^https:\/\//i.test(s);
}

/** URL absolut (https/http//) untuk kartu: naikkan ke https; path lokal dibiarkan. */
function displayRemoteCardUrl(url: string): string {
  const t = url.trim();
  if (!t || t.startsWith("/") || t.toLowerCase().startsWith("data:")) return t;
  return upgradeRemoteImageUrl(t);
}

/** Samakan `src` untuk bandingkan hero vs isi artikel (entity HTML, dll.). */
function normalizeImgSrcForCompare(s: string): string {
  return s
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&#0*38;/g, "&")
    .replace(/&#x0*26;/gi, "&");
}

const FIRST_IMG_OPEN_TAG = /<img\b[^>]*>/i;

/**
 * Hindari gambar ganda di halaman detail: hero sudah menampilkan gambar yang sama
 * dengan `<img>` pertama di HTML artikel.
 */
export function stripFirstBodyImgIfSameAsHero(html: string, heroSrc: string | null): string {
  if (!heroSrc?.trim()) return html;
  const normHero = normalizeImgSrcForCompare(heroSrc);
  const m = FIRST_IMG_OPEN_TAG.exec(html);
  if (!m) return html;
  const tag = m[0];
  const srcM = tag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const rawSrc = (srcM?.[1] ?? srcM?.[2] ?? srcM?.[3] ?? "").trim();
  if (!rawSrc || normalizeImgSrcForCompare(rawSrc) !== normHero) return html;
  const idx = m.index;
  return html.slice(0, idx) + html.slice(idx + tag.length);
}

/**
 * URL gambar untuk kartu berita (beranda / daftar).
 *
 * Di VPS sering terjadi `imageUrl` menunjuk ke `/uploads/news-images/…` tetapi file tidak ada di disk
 * (unduhan RSS gagal atau folder dikosongkan). Isi artikel biasanya masih punya `<img src="https://…">`
 * dari CDN — kita utamakan itu agar thumbnail tidak kosong.
 */
export function resolveHomeNewsCardImageSrc(item: {
  imageUrl: string | null;
  contentHtml: string;
}): string | null {
  const col = item.imageUrl?.trim() ?? "";
  const htmlSrc = firstImgSrcFromHtml(item.contentHtml);

  if (htmlSrc && !isDataUrl(htmlSrc) && (isHttpsUrl(htmlSrc) || /^http:\/\//i.test(htmlSrc) || htmlSrc.startsWith("//"))) {
    return displayRemoteCardUrl(htmlSrc);
  }
  if (col && !isDataUrl(col) && isHttpsUrl(col)) {
    return resolvePublicDisplayUrl(col) ?? displayRemoteCardUrl(col);
  }
  if (col && !isDataUrl(col)) {
    return resolvePublicDisplayUrl(col) ?? displayRemoteCardUrl(col);
  }
  if (htmlSrc && !isDataUrl(htmlSrc)) {
    return resolvePublicDisplayUrl(htmlSrc) ?? displayRemoteCardUrl(htmlSrc);
  }
  return null;
}
