import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getSiteName } from "@/lib/siteNameSettings";
import { auth } from "@/auth";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const SITE_URL = "https://gmrfx.app";

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSiteName();
  const tagline = `${siteName} — Komunitas Trader, Edukasi & Berbagi Strategi`;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: tagline,
      template: `%s | ${siteName}`,
    },
    description:
      "Komunitas trading Indonesia: komunikasi antar trader, edukasi forex & CFD, berbagi strategi, artikel & berita, galeri, marketplace indikator & Expert Advisor.",
    keywords: [
      "komunitas trader",
      "edukasi forex",
      "copy trading",
      "expert advisor",
      "indikator mt4 mt5",
      "trading indonesia",
      "belajar forex",
      "sinyal trading",
      "marketplace ea indikator",
    ],
    authors: [{ name: siteName, url: SITE_URL }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: SITE_URL,
      siteName,
      title: tagline,
      description:
        "Wadah trader untuk berdiskusi, belajar, dan berbagi ide strategi — dengan artikel, komunitas, dan marketplace indikator & EA.",
    },
    twitter: {
      card: "summary_large_image",
      title: tagline,
      description: "Komunitas trading Indonesia — edukasi, copy trading, marketplace indikator & EA.",
    },
    alternates: {
      canonical: SITE_URL,
    },
    verification: {
      google: "v6BkdzSPwb6SMf81sxPzOXqx-_bZVMu_VwfYuCL0dFU",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const criticalCss = `
:root { color-scheme: dark; }
html { background-color: #0b0e11; }
body { margin: 0; min-height: 100vh; background-color: #0b0e11; color: #eaecef; }
/* Jika file CSS Next gagal dimuat (404/proksi), halaman tetap terbaca — utility Tailwind menimpa jika ada. */
`;

  return (
    <html lang="id" className={dmSans.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
      </head>
      <body className="font-sans">
        {/*
          Wrapper flex memastikan main flex-1 + footer mt-auto bekerja meski ada batas client/server.
          overflow-x-hidden mencegah marquee / konten lebar membuat halaman “meluber” horizontal.
        */}
        <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
          {/*
            Kolom flex di sini supaya SiteHeader / main.flex-1 / SiteFooter (dari page atau (site)/layout)
            punya induk flex — tanpa ini, flex-1 di <main> tidak berlaku dan footer bisa “naik”, tampilan berantakan.
          */}
          <Providers session={session}>
            <div className="flex min-h-screen w-full flex-1 flex-col">{children}</div>
          </Providers>
        </div>
      </body>
    </html>
  );
}
