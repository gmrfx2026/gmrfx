import Link from "next/link";
import type { Metadata } from "next";
import { IndikatorCatalogList } from "@/components/indikator/IndikatorCatalogList";

export const metadata: Metadata = {
  title: "Indikator MetaTrader — GMR FX",
  description:
    "Download dan beli indikator MetaTrader MT4/MT5 dari member komunitas dan katalog GMR FX. Tersedia indikator gratis dan berbayar untuk trading forex & CFD.",
  openGraph: {
    title: "Indikator MetaTrader — GMR FX",
    description: "Download indikator MT4/MT5 gratis dan berbayar dari komunitas trader Indonesia.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indikator MetaTrader — GMR FX",
    description: "Download indikator MT4/MT5 gratis dan berbayar dari komunitas trader Indonesia.",
  },
};

export const dynamic = "force-dynamic";

export default function IndikatorCatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Indikator &amp; file strategi</h1>
      <p className="mt-2 text-sm text-broker-muted">
        <span className="text-white/90">General</span> — semua indikator yang dipublikasikan di GMR FX (member,
        komunitas, dan produk resmi). Indikator bertanda{" "}
        <span className="rounded bg-violet-500/20 px-1 text-violet-300">GMRFX</span> memakai{" "}
        <strong className="text-white/80">lisensi online</strong>. Katalog hanya produk resmi:{" "}
        <Link href="/indikator/gmrfx" className="font-medium text-broker-accent hover:underline">
          Indikator GMRFX
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

      <IndikatorCatalogList where={{ published: true }} />

      <p className="mt-10 text-sm text-broker-muted">
        Ingin menjual indikator? Buka{" "}
        <Link href="/profil?tab=indikator" className="text-broker-accent hover:underline">
          Dashboard → Indikator
        </Link>
        .
      </p>
    </div>
  );
}
