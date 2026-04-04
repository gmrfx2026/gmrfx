"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseGoPageDownloadPath } from "@/lib/goPageDownloadPath";

const VISITOR_COOKIE = "gmrfx_go_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]*)`));
  if (match?.[1]) {
    try { return decodeURIComponent(match[1]); } catch { return match[1]; }
  }
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  return id;
}

function openInNewTab(url: string): boolean {
  try {
    const w = window.open(url, "_blank");
    if (w) { try { w.opener = null; } catch { /* ignore */ } return true; }
  } catch { /* ignore */ }
  return false;
}

function openDownloadInNewTab(url: string): boolean {
  if (openInNewTab(url)) return true;
  try {
    const w = window.open("about:blank", "_blank");
    if (w) {
      try { w.opener = null; } catch { /* ignore */ }
      w.location.href = url;
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export function GoOutClient({ brokerUrls }: { brokerUrls: string[] }) {
  const searchParams = useSearchParams();
  const downloadPath = parseGoPageDownloadPath(searchParams.get("download"));

  const [popupBlocked, setPopupBlocked] = useState<boolean | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    void fetch("/api/affiliate/go-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    }).catch(() => {});

    const origin = window.location.origin;
    const fullDownload = downloadPath ? `${origin}${downloadPath}` : "";
    const results: boolean[] = [];
    let dlOk = true;

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timeoutsRef.current.push(id);
    };

    brokerUrls.forEach((url, i) => {
      schedule(() => { results[i] = openInNewTab(url); }, i * 200);
    });

    const checkDelay = Math.max(brokerUrls.length * 200 + 250, 450);
    schedule(() => {
      if (fullDownload) dlOk = openDownloadInNewTab(fullDownload);
      const allOk = results.every(Boolean) && (!downloadPath || dlOk);
      setPopupBlocked(!allOk);
    }, checkDelay);

    return () => {
      for (const id of timeoutsRef.current) clearTimeout(id);
      timeoutsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadPath]);

  if (popupBlocked !== true) return <div className="min-h-[1px] w-full" aria-hidden />;

  return (
    <div className="mx-auto max-w-md px-2 text-center">
      <div
        role="alert"
        className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-left text-sm text-amber-100"
      >
        <p className="font-medium text-amber-50">Popup diblokir</p>
        <p className="mt-2 text-amber-100/90">
          Izinkan <strong>popup</strong> untuk situs ini: klik ikon gembok atau &quot;i&quot; di bilah alamat browser → atur{" "}
          <strong>Popup</strong> menjadi <strong>Izinkan</strong>. Setelah itu, <strong>muat ulang halaman ini</strong>{" "}
          agar tab mitra broker dan unduhan file terbuka otomatis.
        </p>
      </div>
    </div>
  );
}
