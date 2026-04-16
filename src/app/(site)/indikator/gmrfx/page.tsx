import Link from "next/link";
import type { Metadata } from "next";
import { IndikatorCatalogList } from "@/components/indikator/IndikatorCatalogList";

export const metadata: Metadata = {
  title: "Indikator GMRFX — Lisensi resmi",
  description:
    "Indikator MetaTrader resmi GMRFX dengan verifikasi lisensi online. Produk official dengan dukungan key terikat akun GMR FX.",
  openGraph: {
    title: "Indikator GMRFX — Lisensi resmi",
    description: "Indikator MT4/MT5 resmi GMRFX — aktivasi berbasis lisensi via gmrfx.app.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indikator GMRFX — Lisensi resmi",
    description: "Indikator MT resmi GMRFX dengan verifikasi lisensi online.",
  },
};

export const dynamic = "force-dynamic";

export default function IndikatorGmrfxCatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Indikator GMRFX</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Produk resmi dengan <strong className="text-white/90">lisensi terikat akun</strong> — aktivasi memeriksa email
        dan key ke server GMR FX (
        <code className="rounded bg-broker-bg/60 px-1 text-xs text-emerald-300">/api/mt/license/verify</code>
        ). Untuk semua indikator komunitas (member &amp; lainnya) buka{" "}
        <Link href="/indikator" className="font-medium text-broker-accent hover:underline">
          Indikator — General
        </Link>
        .
      </p>
      <p className="mt-2 text-sm text-broker-muted">
        Untuk{" "}
        <Link href="/ea" className="text-broker-accent hover:underline">
          Expert Advisor (EA)
        </Link>{" "}
        buka katalog terpisah.
      </p>

      <IndikatorCatalogList where={{ published: true, isGmrfxOfficial: true }} />

      <p className="mt-10 text-sm text-broker-muted">
        Butuh bantuan aktivasi? Lihat halaman produk setelah pembelian — license key dan email akun ditampilkan di
        sana.
      </p>
    </div>
  );
}
