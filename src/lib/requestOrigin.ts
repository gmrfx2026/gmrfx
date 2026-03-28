import { headers } from "next/headers";

/** Origin permintaan saat ini (untuk URL absolut berbagi, dll.). */
export function requestOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
