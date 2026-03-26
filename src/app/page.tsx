import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { HomePageContent } from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  title: "GMR FX — Edukasi & Komunitas Forex",
  description:
    "Belajar forex dengan materi artikel, galeri, dan komunitas. Wallet IDR antar member dan fitur yang terus berkembang.",
  openGraph: {
    title: "GMR FX — Edukasi & Komunitas Forex",
    description: "Artikel, galeri, dan komunitas trading.",
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
