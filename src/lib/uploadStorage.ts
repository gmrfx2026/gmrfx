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
 * - **VPS / Docker / PM2 (bukan Vercel):** default **lokal** (`public/uploads/`) — tidak perlu Blob.
 * - **Vercel:** default Blob; wajib `BLOB_READ_WRITE_TOKEN` (filesystem serverless read-only).
 * - Paksa Blob di host sendiri: `UPLOAD_STORAGE=blob` + `BLOB_READ_WRITE_TOKEN`.
 */
export function preferLocalUploads(): boolean {
  if (isVercelDeploy()) return false;
  const v = (process.env.UPLOAD_STORAGE ?? "").trim().toLowerCase();
  if (v === "blob") return false;
  return true;
}

/** Token Blob hanya dipakai jika tidak memaksa penyimpanan lokal. */
export function resolvedBlobReadWriteToken(): string | undefined {
  if (preferLocalUploads()) return undefined;
  return blobReadWriteToken();
}
