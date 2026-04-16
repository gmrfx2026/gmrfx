import { resolvePublicDisplayUrl } from "@/lib/publicUploadUrl";

const FIRST_IMG_SRC = /<img[^>]+src\s*=\s*["']([^"']+)["']/i;

/**
 * URL gambar untuk kartu berita (beranda / daftar): kolom `imageUrl` atau gambar pertama di HTML.
 */
export function resolveHomeNewsCardImageSrc(item: {
  imageUrl: string | null;
  contentHtml: string;
}): string | null {
  let raw = item.imageUrl?.trim() ?? "";
  if (!raw) {
    const m = FIRST_IMG_SRC.exec(item.contentHtml);
    raw = m?.[1]?.trim() ?? "";
  }
  if (!raw || raw.toLowerCase().startsWith("data:")) return null;
  return resolvePublicDisplayUrl(raw) ?? raw;
}
