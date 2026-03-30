/**
 * Query `download` di `/go` — hanya path API unduhan marketplace (cegah open redirect).
 */
const DOWNLOAD_PATH_RE = /^\/api\/(indicators|eas)\/[a-z0-9]+\/download$/i;

export function parseGoPageDownloadPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s.length > 200 || !s.startsWith("/") || s.includes("//") || s.includes("..")) {
    return null;
  }
  return DOWNLOAD_PATH_RE.test(s) ? s : null;
}
