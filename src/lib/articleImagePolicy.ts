/** Folder di bawah `public/uploads/` untuk gambar artikel (hanya file yang lolos validasi). */
export const ARTICLE_IMAGES_SUBDIR = "article-images";

/** Gambar berita beranda (impor RSS). */
export const NEWS_IMAGES_SUBDIR = "news-images";

export const ARTICLE_IMAGE_MAX_BYTES = 2.5 * 1024 * 1024;

/** Path publik yang boleh dipakai di atribut `src` gambar artikel (UUID v4 + ekstensi). */
export const ARTICLE_IMAGE_SRC_RE =
  /^\/uploads\/article-images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

export const NEWS_IMAGE_SRC_RE =
  /^\/uploads\/news-images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

export function isAllowedArticleImageSrc(src: string): boolean {
  return ARTICLE_IMAGE_SRC_RE.test(String(src ?? "").trim());
}

export function isAllowedNewsImageSrc(src: string): boolean {
  return NEWS_IMAGE_SRC_RE.test(String(src ?? "").trim());
}

export function isAllowedArticleOrNewsImageSrc(src: string): boolean {
  return isAllowedArticleImageSrc(src) || isAllowedNewsImageSrc(src);
}

/** Deteksi tipe dari isi file (bukan dari header Content-Type / nama file). */
export function sniffArticleImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.subarray(0, 8).equals(pngSig)) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  return null;
}

export function fileExtForArticleType(t: "jpg" | "png" | "webp"): string {
  if (t === "jpg") return "jpg";
  if (t === "png") return "png";
  return "webp";
}
