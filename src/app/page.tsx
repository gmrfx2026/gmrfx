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

export const dynamic = "force-dynamic";

/** Beranda di `app/page.tsx` agar rute `/` selalu ter-resolve (bukan hanya di route group). */
export default async function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-0 min-w-0 flex-1">
        <HomePageContent />
      </main>
      <SiteFooter />
    </>
  );
}
