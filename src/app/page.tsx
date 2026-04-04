import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HomePageContent } from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  title: "GMR FX — Komunitas Trader, Edukasi & Berbagi Strategi",
  description:
    "Platform komunitas trading: komunikasi dan chat antar trader, edukasi forex & CFD, berbagi strategi, artikel & berita, marketplace indikator dan Expert Advisor.",
  openGraph: {
    title: "GMR FX — Komunitas Trader, Edukasi & Berbagi Strategi",
    description:
      "Wadah trader untuk berdiskusi, belajar, dan berbagi ide strategi — dengan artikel, komunitas, dan marketplace indikator & EA.",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gmrfx.app/#organization",
      name: "GMR FX",
      url: "https://gmrfx.app",
      logo: {
        "@type": "ImageObject",
        url: "https://gmrfx.app/opengraph-image",
        width: 1200,
        height: 630,
      },
      description:
        "Komunitas trading Indonesia: edukasi forex & CFD, copy trading, marketplace indikator & Expert Advisor.",
      inLanguage: "id",
    },
    {
      "@type": "WebSite",
      "@id": "https://gmrfx.app/#website",
      url: "https://gmrfx.app",
      name: "GMR FX",
      publisher: { "@id": "https://gmrfx.app/#organization" },
      inLanguage: "id",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://gmrfx.app/cari?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const dynamic = "force-dynamic";

/** Beranda di `app/page.tsx` agar rute `/` selalu ter-resolve (bukan hanya di route group). */
export default async function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="min-h-0 min-w-0 flex-1">
        <HomePageContent />
      </main>
      <SiteFooter />
    </>
  );
}
