"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AFFILIATE_EXNESS_URL, AFFILIATE_TICKMILL_URL } from "@/lib/affiliatePartners";
import { parseGoPageDownloadPath } from "@/lib/goPageDownloadPath";

const VISITOR_COOKIE = "gmrfx_go_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]*)`));
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  return id;
}

function tryOpenUrl(url: string): boolean {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(w);
}

export function GoOutClient() {
  const searchParams = useSearchParams();
  const downloadPath = parseGoPageDownloadPath(searchParams.get("download"));

  const [popupBlocked, setPopupBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    void fetch("/api/affiliate/go-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    }).catch(() => {});

    const ex = tryOpenUrl(AFFILIATE_EXNESS_URL);
    const tk = tryOpenUrl(AFFILIATE_TICKMILL_URL);
    let dl = true;
    if (downloadPath) {
      const origin = window.location.origin;
      dl = tryOpenUrl(`${origin}${downloadPath}`);
    }
    const allOk = ex && tk && (!downloadPath || dl);
    setPopupBlocked(!allOk);
  }, [downloadPath]);

  function openDownloadInNewTab() {
    if (!downloadPath) return;
    tryOpenUrl(`${window.location.origin}${downloadPath}`);
  }

  return (
    <div className="mx-auto max-w-md text-center">
      {popupBlocked === true ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-left text-sm text-amber-100"
        >
          <p className="font-medium text-amber-50">Popup diblokir</p>
          <p className="mt-2 text-amber-100/90">
            Izinkan <strong>popup</strong> untuk situs ini: klik ikon gembok atau &quot;i&quot; di bilah alamat browser →
            atur <strong>Popup</strong> menjadi <strong>Izinkan</strong>. Setelah itu, muat ulang halaman ini atau gunakan
            tombol di bawah.
          </p>
        </div>
      ) : null}

      <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center ${popupBlocked === true ? "mt-6" : ""}`}>
        {downloadPath ? (
          <button
            type="button"
            onClick={() => openDownloadInNewTab()}
            className="rounded-lg border border-emerald-500/50 bg-emerald-950/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/60"
          >
            Unduh file
          </button>
        ) : null}
        <a
          href={AFFILIATE_EXNESS_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex justify-center rounded-lg bg-[#f3a952] px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
        >
          Buka Exness
        </a>
        <a
          href={AFFILIATE_TICKMILL_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Buka Tickmill
        </a>
      </div>

      <a href="/" className="mt-8 inline-block text-sm text-emerald-400 hover:underline">
        Kembali ke beranda
      </a>
    </div>
  );
}
