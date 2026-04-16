import { resolvePublicDisplayUrl } from "@/lib/publicUploadUrl";

/** Src gambar pertama (mendukung atribut acak di <img …>). */
const FIRST_IMG_SRC = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i;

function firstImgSrcFromHtml(html: string): string | null {
  const m = FIRST_IMG_SRC.exec(html);
  const s = m?.[1]?.trim();
  return s || null;
}

function isDataUrl(s: string): boolean {
  return s.toLowerCase().startsWith("data:");
}

function isHttpsUrl(s: string): boolean {
  return /^https:\/\//i.test(s);
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

  if (htmlSrc && !isDataUrl(htmlSrc) && isHttpsUrl(htmlSrc)) {
    return htmlSrc;
  }
  if (col && !isDataUrl(col) && isHttpsUrl(col)) {
    return resolvePublicDisplayUrl(col) ?? col;
  }
  if (col && !isDataUrl(col)) {
    return resolvePublicDisplayUrl(col) ?? col;
  }
  if (htmlSrc && !isDataUrl(htmlSrc)) {
    return resolvePublicDisplayUrl(htmlSrc) ?? htmlSrc;
  }
  return null;
}
