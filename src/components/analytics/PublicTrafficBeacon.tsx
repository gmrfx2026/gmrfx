"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const VID_COOKIE = "gmrfx_vid";

function readVisitorCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${VID_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

function setVisitorCookie(id: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 400;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${VID_COOKIE}=${encodeURIComponent(id)};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}

function getOrCreateVisitorId(): string {
  const existing = readVisitorCookie();
  if (existing && existing.length >= 8) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  setVisitorCookie(id);
  return id;
}

export function PublicTrafficBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams?.toString() ?? "";
  const lastRef = useRef<{ key: string; t: number } | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const fullPath = `${pathname}${qs ? `?${qs}` : ""}`.slice(0, 2048);
    const now = Date.now();
    const prev = lastRef.current;
    if (prev && prev.key === fullPath && now - prev.t < 2500) return;
    lastRef.current = { key: fullPath, t: now };

    const visitorId = getOrCreateVisitorId();
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const hostname = typeof window !== "undefined" ? window.location.host : "";

    const utmSource = searchParams?.get("utm_source")?.trim() || undefined;
    const utmMedium = searchParams?.get("utm_medium")?.trim() || undefined;
    const utmCampaign = searchParams?.get("utm_campaign")?.trim() || undefined;

    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        path: fullPath,
        referrer: referrer ? referrer.slice(0, 2048) : undefined,
        hostname: hostname.slice(0, 255) || undefined,
        utmSource: utmSource?.slice(0, 128),
        utmMedium: utmMedium?.slice(0, 128),
        utmCampaign: utmCampaign?.slice(0, 256),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, qs, searchParams]);

  return null;
}
