"use client";

import { useEffect, useState } from "react";
import { AFFILIATE_EXNESS_URL, AFFILIATE_TICKMILL_URL } from "@/lib/affiliatePartners";

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
  const [logged, setLogged] = useState(false);
  const [autoOpened, setAutoOpened] = useState<boolean | null>(null);

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    void fetch("/api/affiliate/go-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
      .then(() => setLogged(true))
      .catch(() => setLogged(true));

    const ex = tryOpenUrl(AFFILIATE_EXNESS_URL);
    const tk = tryOpenUrl(AFFILIATE_TICKMILL_URL);
    setAutoOpened(ex && tk);
  }, []);

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-lg font-medium text-white">Mitra broker edukasi</p>
      <p className="mt-2 text-sm text-zinc-400">
        Kami mengarahkan Anda ke dua mitra (Exness & Tickmill) di tab baru. Jika tab tidak muncul, gunakan tombol di
        bawah — browser kadang memblokir beberapa jendela sekaligus.
      </p>
      {autoOpened === false ? (
        <p className="mt-2 text-xs text-amber-200/90">Popup diblokir: silakan klik tautan secara manual.</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={AFFILIATE_EXNESS_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="rounded-lg bg-[#f3a952] px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
        >
          Buka Exness
        </a>
        <a
          href={AFFILIATE_TICKMILL_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Buka Tickmill
        </a>
      </div>
      <p className="mt-8 text-xs text-zinc-500">
        {logged ? "Kunjungan tercatat untuk statistik edukasi." : "Mencatat kunjungan…"}
      </p>
      <a href="/" className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
        Kembali ke beranda
      </a>
    </div>
  );
}
