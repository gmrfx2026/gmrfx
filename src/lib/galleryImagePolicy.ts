export const GALLERY_IMAGES_SUBDIR = "gallery-images";

export const GALLERY_IMAGE_MAX_BYTES = 2.5 * 1024 * 1024;

/** Path publik upload galeri admin (UUID v4 + ekstensi) — aman untuk hapus file di disk. */
export const GALLERY_UPLOADED_SRC_RE =
  /^\/uploads\/gallery-images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

export function isDeletableGalleryUploadUrl(url: string): boolean {
  return GALLERY_UPLOADED_SRC_RE.test(String(url ?? "").trim());
}

/** Deteksi tipe dari isi file (bukan dari extension / Content-Type). */
export function sniffGalleryImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.subarray(0, 8).equals(pngSig)) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") {
    return "webp";
  }
  return null;
}

export function fileExtForGalleryType(t: "jpg" | "png" | "webp"): string {
  if (t === "jpg") return "jpg";
  if (t === "png") return "png";
  return "webp";
}
