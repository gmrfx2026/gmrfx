import { headers } from "next/headers";

/** Origin situs untuk URL absolut (ingest EA, dll.) dari header request. */
export function siteOriginFromHeaders(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
