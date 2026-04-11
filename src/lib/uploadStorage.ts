const BLOB_ENV_KEY = ["BLOB", "READ", "WRITE", "TOKEN"].join("_");

export function blobReadWriteToken(): string | undefined {
  const v = process.env[BLOB_ENV_KEY];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

export function isVercelDeploy(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Simpan unggahan ke `public/uploads/` (lewati Vercel Blob).
 *
 * - Otomatis di `next dev` (`NODE_ENV=development`), kecuali `UPLOAD_STORAGE=blob`.
 * - Paksa lokal: `UPLOAD_STORAGE=local`
 * - Di Vercel selalu false (Blob atau error konfigurasi).
 */
export function preferLocalUploads(): boolean {
  if (isVercelDeploy()) return false;
  const v = (process.env.UPLOAD_STORAGE ?? "").trim().toLowerCase();
  if (v === "blob") return false;
  if (v === "local") return true;
  return process.env.NODE_ENV === "development";
}

/** Token Blob hanya dipakai jika tidak memaksa penyimpanan lokal. */
export function resolvedBlobReadWriteToken(): string | undefined {
  if (preferLocalUploads()) return undefined;
  return blobReadWriteToken();
}
