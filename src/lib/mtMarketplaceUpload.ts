import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const MT_MARKETPLACE_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXT = new Set(["zip", "ex4", "ex5", "mq4", "mq5"]);

/** `indicators` | `eas` — folder Blob & `public/uploads/`. */
export type MtMarketplaceBucket = "indicators" | "eas";

export function resolveMtMarketplaceExt(file: File): string | null {
  const n = file.name.toLowerCase();
  const dot = n.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = n.slice(dot + 1);
  return ALLOWED_EXT.has(ext) ? ext : null;
}

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

function blobRwToken(): string | undefined {
  const key = ["BLOB", "READ", "WRITE", "TOKEN"].join("_");
  const v = process.env[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function safeStoredName(originalName: string, fallback: string): string {
  const base = originalName.replace(/[/\\]/g, "").trim() || fallback;
  return base.slice(0, 180);
}

/**
 * Simpan file indikator/EA ke Blob atau `public/uploads/{bucket}/{userId}/`.
 */
export async function storeMtMarketplaceFile(
  userId: string,
  file: File,
  buf: Buffer,
  bucket: MtMarketplaceBucket,
  fallbackDownloadName: string
): Promise<{ fileUrl: string; fileName: string }> {
  const ext = resolveMtMarketplaceExt(file);
  if (!ext) {
    throw new Error("Ekstensi tidak didukung. Gunakan .zip, .ex4, .ex5, .mq4, atau .mq5.");
  }

  const fileName = safeStoredName(file.name, fallbackDownloadName);
  const idPart = randomBytes(8).toString("hex");
  const blobName = `${bucket}/${userId}/${idPart}.${ext}`;

  const token = blobRwToken();
  if (token) {
    try {
      const blob = await put(blobName, buf, {
        access: "public",
        contentType: "application/octet-stream",
        addRandomSuffix: false,
        token,
      });
      return { fileUrl: blob.url, fileName };
    } catch (e) {
      console.error("mt marketplace blob upload", e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("No token found") || msg.includes("BLOB_READ_WRITE_TOKEN")) {
        throw new Error(
          "Env BLOB_READ_WRITE_TOKEN belum terset untuk environment ini. Cek Settings → Environment Variables lalu redeploy."
        );
      }
      throw new Error("Gagal mengunggah ke penyimpanan blob.");
    }
  }

  if (isVercel()) {
    throw new Error(
      "Unggah file membutuhkan Vercel Blob: set BLOB_READ_WRITE_TOKEN untuk Production (Storage → Blob)."
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", bucket, userId);
  await mkdir(dir, { recursive: true });
  const diskName = `${idPart}.${ext}`;
  await writeFile(path.join(dir, diskName), buf);
  return {
    fileUrl: `/uploads/${bucket}/${userId}/${diskName}`,
    fileName,
  };
}

const LOCAL_RE = {
  indicators: /^\/uploads\/indicators\/([^/]+)\/([a-f0-9]+\.(zip|ex4|ex5|mq4|mq5))$/i,
  eas: /^\/uploads\/eas\/([^/]+)\/([a-f0-9]+\.(zip|ex4|ex5|mq4|mq5))$/i,
} as const;

export function localMtMarketplaceFileAbsolutePath(fileUrl: string): string | null {
  for (const bucket of ["indicators", "eas"] as const) {
    if (!fileUrl.startsWith(`/uploads/${bucket}/`)) continue;
    const m = fileUrl.match(LOCAL_RE[bucket]);
    if (!m) continue;
    const abs = path.join(process.cwd(), "public", "uploads", bucket, m[1], m[2]);
    const root = path.join(process.cwd(), "public", "uploads", bucket);
    if (!abs.startsWith(root)) continue;
    return abs;
  }
  return null;
}
