import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "GMR FX — Edukasi & Komunitas Forex",
  description:
    "Artikel, galeri, dan komunitas trading. Wallet IDR antar member dan pengembangan toko indikator.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={dmSans.variable}>
      <body className="font-sans">
        {/*
          Wrapper flex memastikan main flex-1 + footer mt-auto bekerja meski ada batas client/server.
          overflow-x-hidden mencegah marquee / konten lebar membuat halaman “meluber” horizontal.
        */}
        <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
