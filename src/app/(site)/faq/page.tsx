import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ — GMR FX",
  description:
    "Pertanyaan yang sering diajukan tentang akun, wallet, marketplace indikator & EA, escrow, dan penggunaan GMR FX.",
};

const items: { q: string; a: ReactNode }[] = [
  {
    q: "Apa itu GMR FX?",
    a: (
      <>
        GMR FX adalah platform edukasi dan komunitas seputar trading, dengan fitur member seperti wallet
        IDR, marketplace indikator/EA, artikel, dan integrasi portofolio MetaTrader. Bukan penyedia sinyal
        investasi pribadi dan bukan pialang.
      </>
    ),
  },
  {
    q: "Bagaimana cara mendaftar?",
    a: (
      <>
        Gunakan halaman <Link href="/daftar">Daftar</Link>, isi data yang diminta, lalu{" "}
        <Link href="/login">Login</Link>. Lengkapi profil bila diperlukan agar semua fitur terbuka.
      </>
    ),
  },
  {
    q: "Apa itu saldo wallet?",
    a: "Saldo wallet adalah nilai dalam Rupiah (IDR) di akun Anda yang dipakai untuk transfer ke sesama member dan untuk membeli produk berbayar di marketplace indikator/EA, sesuai ketentuan platform.",
  },
  {
    q: "Bagaimana membeli indikator atau EA?",
    a: (
      <>
        Kunjungi <Link href="/indikator">Indikator</Link> atau <Link href="/ea">EA</Link>, buka halaman
        produk, lalu ikuti tombol beli. Produk gratis biasanya langsung dapat diunduh; produk berbayar
        memotong saldo wallet Anda.
      </>
    ),
  },
  {
    q: "Mengapa dana penjual tidak langsung masuk setelah saya membeli?",
    a: "Untuk transaksi berbayar, platform memakai mekanisme escrow: dana ditahan sementara agar pembeli punya waktu memastikan produk atau mengajukan komplain. Setelah masa komplain lewat tanpa sengketa, atau setelah pembeli mengonfirmasi, atau setelah keputusan admin, dana mengalir ke penjual atau dikembalikan ke pembeli sesuai kasusnya.",
  },
  {
    q: "Saya pembeli — bagaimana mengonfirmasi atau komplain?",
    a: (
      <>
        Buka <Link href="/profil?tab=wallet">Profil → Wallet</Link>. Di bagian{" "}
        <strong>Pembelian marketplace (escrow)</strong>, gunakan tombol konfirmasi jika barang sudah sesuai,
        atau ajukan komplain dengan alasan jelas jika ada masalah. Komplain ditinjau admin.
      </>
    ),
  },
  {
    q: "Berapa lama masa escrow?",
    a: "Lama penahanan diatur pengelola (biasanya beberapa hari). Detail untuk transaksi Anda tampil di riwayat wallet dan di daftar escrow. Pencairan otomatis ke penjual dijadwalkan setelah masa tersebut lewat jika status tetap normal.",
  },
  {
    q: "Berapa panjang deskripsi produk yang boleh diisi?",
    a: "Untuk indikator dan EA, sistem membatasi panjang deskripsi hingga sekitar 200.000 karakter setelah penyesuaian format. Disarankan tetap ringkas dan jelas agar pembeli mudah memahami.",
  },
  {
    q: "Apakah konten di situs ini rekomendasi investasi?",
    a: "Konten bersifat edukasi dan informasi umum. Bukan nasihat investasi yang disesuaikan dengan situasi pribadi Anda. Trading berisiko tinggi; putuskan sendiri dengan mempertimbangkan tujuan dan kemampuan finansial Anda.",
  },
  {
    q: "Di mana petunjuk penggunaan lengkap?",
    a: (
      <>
        Lihat halaman <Link href="/cara-pemakaian">Petunjuk &amp; Penggunaan</Link> untuk uraian fitur utama.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs text-broker-muted">
        <Link href="/" className="text-broker-accent hover:underline">
          ← Beranda
        </Link>
        {" · "}
        <Link href="/cara-pemakaian" className="text-broker-accent hover:underline">
          Petunjuk &amp; Penggunaan
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-white">Pertanyaan umum (FAQ)</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Jawaban singkat untuk topik yang sering ditanyakan. Belum menemukan jawaban? Periksa juga{" "}
        <Link href="/cara-pemakaian" className="text-broker-accent hover:underline">
          Petunjuk &amp; Penggunaan
        </Link>
        , <Link href="/syarat-ketentuan" className="text-broker-accent hover:underline">
          Syarat &amp; ketentuan
        </Link>
        , atau hubungi pengelola melalui kanal resmi situs.
      </p>

      <div className="mt-8 space-y-3">
        {items.map((it) => (
          <details
            key={it.q}
            className="group rounded-lg border border-broker-border bg-broker-surface/30 open:border-broker-accent/30 open:bg-broker-surface/45"
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                <span>{it.q}</span>
                <span className="shrink-0 text-broker-muted transition group-open:rotate-180">▼</span>
              </span>
            </summary>
            <div className="border-t border-broker-border/60 px-4 py-3 text-sm leading-relaxed text-broker-muted prose prose-invert prose-sm max-w-none prose-a:text-broker-accent">
              <p className="m-0">{it.a}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
