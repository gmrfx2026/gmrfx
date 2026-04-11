import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import {
  ARTICLE_IMAGE_MAX_BYTES,
  fileExtForArticleType,
  sniffArticleImageType,
} from "@/lib/articleImagePolicy";
import { isVercelDeploy, resolvedBlobReadWriteToken } from "@/lib/uploadStorage";

/**
 * Unduh gambar dari URL (RSS): simpan ke Vercel Blob bila ada token; di self-host kembalikan URL asli
 * (setelah validasi) agar tidak bergantung pada disk ephermeral. Hanya JPG/PNG/WebP yang lolos magic byte.
 */
export async function storeRemoteNewsImage(imageUrl: string): Promise<string | null> {
  let resolved = imageUrl.trim();
  if (resolved.startsWith("//")) resolved = `https:${resolved}`;
  if (!/^https?:\/\//i.test(resolved)) return null;

  try {
    const res = await fetch(resolved, {
      headers: { "User-Agent": "GMRFX-NewsImport/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 12 || buf.length > ARTICLE_IMAGE_MAX_BYTES) return null;
    const kind = sniffArticleImageType(buf);
    if (!kind) return null;
    const ext = fileExtForArticleType(kind);
    const filename = `${randomUUID()}.${ext}`;
    const token = resolvedBlobReadWriteToken();

    if (token) {
      try {
        const blob = await put(`news/${filename}`, buf, {
          access: "public",
          contentType: `image/${kind === "jpg" ? "jpeg" : kind}`,
          addRandomSuffix: false,
          token,
        });
        return blob.url;
      } catch (e) {
        console.error("news image blob", e);
        if (!isVercelDeploy()) return resolved;
        return null;
      }
    }

    if (isVercelDeploy() && !token) {
      return null;
    }

    /**
     * Self-host (Coolify, dll.): jangan simpan ke disk — volume sering tidak persisten,
     * sehingga `/uploads/news-images/...` di DB mengarah ke file yang hilang setelah redeploy.
     * URL asli sudah divalidasi (fetch + magic byte); hotlink untuk tampilan kartu berita.
     */
    return resolved;
  } catch (e) {
    console.error("storeRemoteNewsImage", e);
    return null;
  }
}
