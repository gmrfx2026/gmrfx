"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  indicatorId: string;
  slug: string;
  priceIdr: number;
  /** Penjual, gratis, atau sudah beli */
  canDownload: boolean;
  isLoggedIn: boolean;
  isOwn: boolean;
};

export function IndicatorMarketActions({
  indicatorId,
  slug,
  priceIdr,
  canDownload,
  isLoggedIn,
  isOwn,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const paid = priceIdr > 0;
  const callback = `/indikator/${encodeURIComponent(slug)}`;

  async function purchase() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/indicators/${indicatorId}/purchase`, { method: "POST" });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Pembelian gagal");
        return;
      }
      router.refresh();
    } catch {
      setErr("Jaringan error. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (isOwn) {
    return (
      <p className="text-sm text-broker-muted">
        Ini indikator Anda. Kelola dari{" "}
        <Link href="/profil?tab=indikator" className="font-medium text-broker-accent hover:underline">
          Dashboard → Indikator
        </Link>
        .
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-broker-muted">
          {paid
            ? "Masuk untuk membeli dan mengunduh file ini."
            : "Masuk untuk mengunduh file indikator gratis."}
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callback)}`}
          className="inline-flex rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg transition hover:opacity-90"
        >
          Login / Daftar
        </Link>
      </div>
    );
  }

  if (canDownload) {
    return (
      <a
        href={`/api/indicators/${indicatorId}/download`}
        className="inline-flex rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg transition hover:opacity-90"
      >
        {paid ? "Unduh file" : "Unduh gratis"}
      </a>
    );
  }

  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={() => void purchase()}
        className="inline-flex rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Memproses…" : `Beli — Rp ${priceIdr.toLocaleString("id-ID")}`}
      </button>
      <p className="text-xs text-broker-muted">
        Pembayaran memakai saldo wallet IDR. Pastikan saldo cukup di menu Wallet.
      </p>
    </div>
  );
}
