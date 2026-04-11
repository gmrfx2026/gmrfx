import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import {
  ARTICLE_IMAGE_MAX_BYTES,
  NEWS_IMAGES_SUBDIR,
  fileExtForArticleType,
  sniffArticleImageType,
} from "@/lib/articleImagePolicy";
import { isVercelDeploy, resolvedBlobReadWriteToken } from "@/lib/uploadStorage";

/**
 * Unduh gambar dari URL (RSS) lalu simpan ke Blob atau `public/uploads/news-images/`.
 * Hanya JPG/PNG/WebP yang lolos magic byte.
 */
export async function storeRemoteNewsImage(imageUrl: string): Promise<string | null> {
  let resolved = imageUrl.trim();
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
        return null;
      }
    }

    if (isVercelDeploy() && !token) {
      return null;
    }

    const dir = path.join(process.cwd(), "public", "uploads", NEWS_IMAGES_SUBDIR);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
    return `/uploads/${NEWS_IMAGES_SUBDIR}/${filename}`;
  } catch (e) {
    console.error("storeRemoteNewsImage", e);
    return null;
  }
}
