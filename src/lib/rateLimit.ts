/**
 * Rate limiter in-memory sederhana (fixed-window) untuk route publik tanpa auth.
 *
 * - Kunci bebas (mis. `checkavail:<ip>`) — caller yang menentukan scope.
 * - Hanya berlaku per-instance Node. Cukup karena app di-deploy single pm2 fork.
 * - Pembersihan opportunistic saat ukuran bucket melampaui ambang agar memori terbatas.
 *
 * Return:
 *   { allowed: true, remaining, resetInSec }  — request boleh lanjut
 *   { allowed: false, retryAfterSec }          — request harus ditolak (HTTP 429)
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

function pruneIfNeeded(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  let removed = 0;
  /** `Array.from` menghindari iterasi Map langsung agar tetap kompatibel dengan target TS lama. */
  const keys = Array.from(buckets.keys());
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const b = buckets.get(k);
    if (b && b.resetAt <= now) {
      buckets.delete(k);
      removed++;
      if (removed >= 2000) break;
    }
  }
}

export type RateLimitResult =
  | { allowed: true; remaining: number; resetInSec: number }
  | { allowed: false; retryAfterSec: number };

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneIfNeeded(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: max - existing.count,
    resetInSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * Ambil IP client dari header standar. Di belakang Traefik/Nginx nilai ini diset oleh
 * reverse proxy — jangan percaya input ini untuk otorisasi, cukup untuk rate limit.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
