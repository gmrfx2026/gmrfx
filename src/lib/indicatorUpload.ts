import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const INDICATOR_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXT = new Set(["zip", "ex4", "ex5", "mq4", "mq5"]);

export function resolveIndicatorExt(file: File): string | null {
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

function safeStoredName(originalName: string): string {
  const base = originalName.replace(/[/\\]/g, "").trim() || "indikator";
  return base.slice(0, 180);
}

/**
 * Simpan file indikator ke Blob atau `public/uploads/indicators/{userId}/`.
 * Mengembalikan `fileUrl` (absolut atau path publik) dan nama unduhan yang aman.
 */
export async function storeIndicatorFile(
  userId: string,
  file: File,
  buf: Buffer
): Promise<{ fileUrl: string; fileName: string }> {
  const ext = resolveIndicatorExt(file);
  if (!ext) {
    throw new Error("Ekstensi tidak didukung. Gunakan .zip, .ex4, .ex5, .mq4, atau .mq5.");
  }

  const fileName = safeStoredName(file.name);
  const idPart = randomBytes(8).toString("hex");
  const blobName = `indicators/${userId}/${idPart}.${ext}`;

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
      console.error("indicator blob upload", e);
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
      "Unggah indikator membutuhkan Vercel Blob: set BLOB_READ_WRITE_TOKEN untuk Production (Storage → Blob)."
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "indicators", userId);
  await mkdir(dir, { recursive: true });
  const diskName = `${idPart}.${ext}`;
  await writeFile(path.join(dir, diskName), buf);
  return {
    fileUrl: `/uploads/indicators/${userId}/${diskName}`,
    fileName,
  };
}

/** Path file lokal yang diizinkan untuk dibaca server (unduhan). */
export function localIndicatorFileAbsolutePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith("/uploads/indicators/")) return null;
  const m = fileUrl.match(/^\/uploads\/indicators\/([^/]+)\/([a-f0-9]+\.(zip|ex4|ex5|mq4|mq5))$/i);
  if (!m) return null;
  const abs = path.join(process.cwd(), "public", "uploads", "indicators", m[1], m[2]);
  const root = path.join(process.cwd(), "public", "uploads", "indicators");
  if (!abs.startsWith(root)) return null;
  return abs;
}
