import { unlink } from "fs/promises";
import path from "path";
import { isDeletableGalleryUploadUrl } from "@/lib/galleryImagePolicy";

/** Hapus file di `public/` jika URL adalah upload galeri lokal yang valid. */
export async function unlinkGalleryUploadFile(imageUrl: string): Promise<void> {
  if (!isDeletableGalleryUploadUrl(imageUrl)) return;
  const rel = imageUrl.trim().replace(/^\//, "");
  const fsPath = path.join(process.cwd(), "public", rel);
  try {
    await unlink(fsPath);
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? (e as NodeJS.ErrnoException).code : "";
    if (code !== "ENOENT") console.error("[gallery] unlink failed:", fsPath, e);
  }
}
