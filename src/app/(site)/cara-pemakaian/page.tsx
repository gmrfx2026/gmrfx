import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Petunjuk & Penggunaan — GMR FX",
  description:
    "Petunjuk dan panduan penggunaan GMR FX: akun member, wallet, marketplace indikator & EA, escrow, dan fitur komunitas.",
};

export default function CaraPemakaianPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs text-broker-muted">
        <Link href="/" className="text-broker-accent hover:underline">
          ← Beranda
        </Link>
        {" · "}
        <Link href="/faq" className="text-broker-accent hover:underline">
          FAQ
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-white">Petunjuk &amp; Penggunaan</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Ringkasan langkah memakai situs dan fitur utama. Untuk pertanyaan spesifik, lihat juga halaman{" "}
        <Link href="/faq" className="text-broker-accent hover:underline">
          FAQ
        </Link>
        .
      </p>

      <div className="prose prose-invert prose-sm mt-8 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-broker-muted prose-li:text-broker-muted prose-strong:text-zinc-200 prose-a:text-broker-accent">
        <h2>1. Mulai: daftar dan masuk</h2>
        <ul>
          <li>
            Buka <Link href="/daftar">Daftar</Link> untuk membuat akun, lalu{" "}
            <Link href="/login">Login</Link> kapan saja.
          </li>
          <li>
            Lengkapi profil jika diminta (misalnya nama tampilan, data dasar) agar fitur member dan komunitas
            dapat digunakan penuh.
          </li>
        </ul>

        <h2>2. Dashboard member</h2>
        <p>
          Setelah login, buka <Link href="/profil">Dashboard member</Link> (menu profil). Di sini Anda
          mengatur avatar, status, artikel, notifikasi, keamanan, chat, dan tab khusus seperti{" "}
          <strong>Wallet</strong>, <strong>Indikator</strong>, dan <strong>Expert (EA)</strong>.
        </p>

        <h2>3. Wallet (saldo IDR)</h2>
        <ul>
          <li>
            Di tab <Link href="/profil?tab=wallet">Wallet</Link> Anda melihat saldo dan dapat mentransfer
            ke member lain (sesuai aturan yang berlaku di platform).
          </li>
          <li>
            Riwayat transfer menampilkan arus keluar/masuk. Untuk pembelian marketplace berbayar, catatan
            transfer dapat berlabel escrow — dana ditahan sementara (lihat bagian marketplace di bawah).
          </li>
        </ul>

        <h2>4. Marketplace indikator &amp; EA</h2>
        <ul>
          <li>
            Jelajahi katalog: <Link href="/indikator">Indikator</Link> dan <Link href="/ea">Expert Advisor (EA)</Link>
            . Produk gratis dapat diunduh setelah login (jika diperlukan); produk berbayar memakai saldo wallet.
          </li>
          <li>
            <strong>Membeli:</strong> di halaman produk, gunakan tombol beli. Saldo Anda akan terdebit; hak
            unduh mengikuti aturan produk.
          </li>
          <li>
            <strong>Escrow (dana ditahan):</strong> untuk pembelian berbayar, dana tidak langsung masuk ke
            saldo penjual. Masa penahanan mengikuti pengaturan situs (misalnya beberapa hari). Pembeli dapat{" "}
            <strong>mengonfirmasi barang sudah sesuai</strong> agar dana lebih cepat cair ke penjual, atau{" "}
            <strong>mengajukan komplain</strong> jika ada masalah — admin meninjau sebelum refund atau
            pencairan.
          </li>
          <li>
            Di tab Wallet, bagian <strong>Pembelian marketplace (escrow)</strong> menampilkan status transaksi
            Anda sebagai pembeli atau penjual.
          </li>
          <li>
            <strong>Menjual:</strong> di dashboard, tab Indikator atau Expert digunakan untuk mengunggah
            file, harga, deskripsi, dan mempublikasikan produk (setelah memenuhi syarat yang ditentukan).
          </li>
        </ul>

        <h2>5. Portofolio &amp; komunitas MetaTrader</h2>
        <p>
          Dari menu portofolio (sidebar member) Anda dapat menghubungkan akun MetaTrader, melihat ringkasan,
          jurnal, dan fitur komunitas seperti berbagi aktivitas atau langganan fitur komunitas — sesuai yang
          tersedia di akun Anda.
        </p>

        <h2>6. Artikel &amp; konten</h2>
        <p>
          <Link href="/artikel">Artikel</Link> edukasi tersedia untuk dibaca. Member yang diizinkan dapat
          menulis artikel dari dashboard.
        </p>

        <h2>7. Privasi &amp; aturan</h2>
        <p>
          Baca <Link href="/kebijakan-privasi">Kebijakan privasi</Link> dan{" "}
          <Link href="/syarat-ketentuan">Syarat &amp; ketentuan</Link> untuk hak, kewajiban, dan batasan
          penggunaan layanan.
        </p>

        <p className="text-xs text-broker-muted/90">
          Fitur dapat diperbarui sewaktu-waktu. Tampilan menu dapat disesuaikan oleh pengelola situs.
        </p>
      </div>
    </div>
  );
}
