import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  ARTICLE_IMAGE_MAX_BYTES,
  fileExtForArticleType,
  sniffArticleImageType,
} from "@/lib/articleImagePolicy";
import { isVercelDeploy, resolvedBlobReadWriteToken } from "@/lib/uploadStorage";

const SUBDIR = "indicator-covers";

export async function storeIndicatorCoverImage(indicatorId: string, file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 12 || buf.length > ARTICLE_IMAGE_MAX_BYTES) {
    throw new Error("Ukuran gambar tidak valid (maks. ~2,5 MB)");
  }
  const kind = sniffArticleImageType(buf);
  if (!kind) {
    throw new Error("Gunakan gambar JPG, PNG, atau WebP");
  }
  const ext = fileExtForArticleType(kind);
  const basename = `${indicatorId}.${ext}`;
  const token = resolvedBlobReadWriteToken();

  if (token) {
    const blob = await put(`${SUBDIR}/${basename}`, buf, {
      access: "public",
      contentType: `image/${kind === "jpg" ? "jpeg" : kind}`,
      addRandomSuffix: false,
      allowOverwrite: true,
      token,
    });
    return blob.url;
  }

  if (isVercelDeploy()) {
    throw new Error("Unggah sampul membutuhkan Vercel Blob (BLOB_READ_WRITE_TOKEN)");
  }

  const dir = path.join(process.cwd(), "public", "uploads", SUBDIR);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, basename), buf);
  return `/api/public-file/${SUBDIR}/${basename}`;
}
