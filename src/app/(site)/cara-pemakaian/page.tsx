import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Petunjuk & Penggunaan — GMR FX",
  description:
    "Panduan untuk member: akun, profil, wallet, marketplace indikator & EA, portofolio MetaTrader, komunitas, artikel, dan aturan penggunaan.",
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
        Panduan ini ditujukan untuk <strong className="text-zinc-300">member</strong> (pengguna terdaftar). Untuk
        pertanyaan singkat, lihat juga{" "}
        <Link href="/faq" className="text-broker-accent hover:underline">
          FAQ
        </Link>
        .
      </p>

      <div className="prose prose-invert prose-sm mt-8 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-broker-muted prose-li:text-broker-muted prose-strong:text-zinc-200 prose-a:text-broker-accent">
        <h2>1. Mulai: daftar, masuk, dan profil</h2>
        <ul>
          <li>
            Buat akun lewat <Link href="/daftar">Daftar</Link>, lalu masuk lewat <Link href="/login">Login</Link>{" "}
            kapan saja.
          </li>
          <li>
            Jika diminta, lengkapi data di <Link href="/lengkapi-profil">Lengkapi profil</Link> agar fitur komunitas
            dan profil publik dapat dipakai sesuai ketentuan situs.
          </li>
          <li>
            Anda dapat memakai login Google jika opsi tersebut aktif di halaman masuk.
          </li>
        </ul>

        <h2>2. Dashboard member</h2>
        <p>
          Setelah login, buka <Link href="/profil">Profil / dashboard member</Link>. Di area ini Anda biasanya dapat:
        </p>
        <ul>
          <li>Mengatur tampilan profil, status, dan konten yang Anda publikasikan.</li>
          <li>
            Mengelola <strong>Wallet</strong> (saldo), <strong>Indikator</strong> dan <strong>Expert Advisor (EA)</strong>{" "}
            jika Anda menjual di marketplace, serta tab lain yang tampil di menu Anda.
          </li>
          <li>Membuka chat, notifikasi, dan pengaturan keamanan sesuai menu yang disediakan.</li>
        </ul>
        <p>
          Susunan menu dapat sedikit berbeda antar akun; gunakan tautan yang tersedia di sidebar atau header member.
        </p>

        <h2>3. Wallet (saldo IDR)</h2>
        <ul>
          <li>
            Di tab <Link href="/profil?tab=wallet">Wallet</Link> Anda melihat saldo dan dapat melakukan transfer ke
            member lain sesuai aturan nominal dan kebijakan yang berlaku di platform.
          </li>
          <li>
            Riwayat transfer menampilkan arus keluar dan masuk. Untuk pembelian produk berbayar di marketplace, entri
            terkait dapat tampil bersama status escrow (dana ditahan sementara hingga memenuhi syarat pencairan).
          </li>
          <li>
            Di bagian yang berjudul sejenis <strong>Pembelian marketplace (escrow)</strong>, Anda dapat memantau
            transaksi sebagai pembeli atau penjual: mengonfirmasi penerimaan, atau mengajukan komplain jika produk tidak
            sesuai — proses selanjutnya mengikuti kebijakan platform.
          </li>
        </ul>

        <h2>4. Marketplace indikator &amp; EA</h2>
        <h3>Membeli</h3>
        <ul>
          <li>
            Jelajahi <Link href="/indikator">Indikator</Link> dan <Link href="/ea">Expert Advisor (EA)</Link>. Produk
            gratis biasanya dapat diunduh setelah login (jika diperlukan); produk berbayar memotong saldo wallet Anda.
          </li>
          <li>
            Di halaman produk, gunakan tombol pembelian. Setelah berhasil, ikuti petunjuk unduh atau akses file sesuai
            halaman produk.
          </li>
        </ul>
        <h3>Escrow (dana ditahan)</h3>
        <ul>
          <li>
            Untuk pembelian berbayar, dana tidak langsung menjadi saldo penjual. Masa penahanan dan alur pencairan
            mengikuti pengaturan situs.
          </li>
          <li>
            Sebagai <strong>pembeli</strong>, Anda dapat mengonfirmasi bahwa produk sudah sesuai agar alur pencairan ke
            penjual berjalan sesuai ketentuan, atau mengajukan komplain melalui fitur yang disediakan jika ada masalah.
          </li>
          <li>
            Sebagai <strong>penjual</strong>, pantau status di Wallet agar Anda tahu kapan dana cair atau jika ada
            sanggahan dari pembeli.
          </li>
        </ul>
        <h3>Menjual</h3>
        <ul>
          <li>
            Dari dashboard member, gunakan tab <strong>Indikator</strong> atau <strong>Expert (EA)</strong> untuk
            mengunggah file, menentukan harga (termasuk harga 0 untuk gratis), deskripsi, dan mempublikasikan produk
            setelah persyaratan terpenuhi.
          </li>
        </ul>

        <h2>5. Portofolio MetaTrader</h2>
        <p>
          Lewat menu <strong>Portofolio</strong> (sidebar member), Anda menghubungkan terminal MetaTrader ke situs
          dengan <strong>token EA</strong> dan melihat data yang dikirim ke server.
        </p>
        <h3>Menghubungkan akun</h3>
        <ul>
          <li>
            Buka <Link href="/profil/portfolio/dashboard">Dashboard portofolio</Link>. Di sini Anda membuat token,
            melihat endpoint ingest MetaTrader 4 / 5, dan mengelola token aktif (salin atau cabut).
          </li>
          <li>
            Pasang token tersebut di Expert Advisor sesuai README proyek (folder <code className="text-broker-accent">mql4</code> /{" "}
            <code className="text-broker-accent">mql5</code>), lalu izinkan URL API di MetaTrader.
          </li>
          <li>
            Setelah EA mengirim <strong>deal</strong> atau <strong>snapshot</strong> saldo, akun login MetaTrader Anda
            akan muncul di daftar portofolio (misalnya di Ringkasan dan menu terkait).
          </li>
          <li>
            Periksa <Link href="/profil/portfolio/trade-log">Trade log</Link> bila perlu memastikan data masuk.
          </li>
        </ul>
        <h3>Ringkasan, jurnal, trade log, playbook</h3>
        <ul>
          <li>
            <Link href="/profil/portfolio/summary">Ringkasan</Link>: angka kinerja per rentang tanggal untuk akun yang
            dipilih.
          </li>
          <li>
            <Link href="/profil/portfolio/journal">Jurnal</Link>: tampilan kalender terkait deal penutupan (zona waktu
            Indonesia).
          </li>
          <li>
            <Link href="/profil/portfolio/trade-log">Trade log</Link>: tabel riwayat deal.
          </li>
          <li>
            <Link href="/profil/portfolio/playbook">Playbook</Link>: catatan strategi Anda (jika fitur ini aktif untuk
            akun Anda).
          </li>
        </ul>
        <h3>Menghapus akun dari portofolio situs</h3>
        <ul>
          <li>
            Di halaman yang menampilkan kartu login (Dashboard / Ringkasan), Anda dapat menggunakan opsi hapus untuk
            menghapus akun tersebut beserta log terkait di situs — ini tidak menutup akun di broker, hanya data di GMR
            FX.
          </li>
        </ul>

        <h2>6. Komunitas portofolio</h2>
        <p>Bagian <strong>Komunitas</strong> di area portofolio memungkinkan Anda (sesuai menu yang aktif):</p>
        <ul>
          <li>
            <Link href="/profil/portfolio/community/accounts">Akun</Link>: melihat akun yang dipublikasikan member lain
            (tanpa menampilkan nomor login di daftar; detail mengikuti halaman yang dibuka).
          </li>
          <li>
            <Link href="/profil/portfolio/community/following">Mengikuti (copy)</Link>: akun komunitas yang Anda ikuti
            untuk layanan salin/copy sesuai pengaturan pemilik.
          </li>
          <li>
            <Link href="/profil/portfolio/community/pengikut">Pengikut akun</Link>: siapa yang mengikuti akun Anda,
            termasuk status langganan jika berlaku.
          </li>
          <li>
            <Link href="/profil/portfolio/community/publish">Publikasi komunitas</Link>: mengatur apakah akun Anda
            tampil di komunitas, opsi copy/ikuti, dan harga jika berbayar.
          </li>
        </ul>

        <h2>7. Artikel, berita, galeri &amp; pencarian</h2>
        <ul>
          <li>
            <Link href="/artikel">Artikel</Link>: baca materi edukasi; jika diizinkan, Anda dapat menulis artikel dari
            dashboard member.
          </li>
          <li>
            <Link href="/berita">Berita</Link>: konten berita yang disajikan situs (dalam negeri / internasional sesuai
            penyediaan).
          </li>
          <li>
            <Link href="/galeri">Galeri</Link>: kumpulan gambar atau karya yang dipublikasikan.
          </li>
          <li>
            <Link href="/cari">Cari</Link>: pencarian konten di situs.
          </li>
        </ul>

        <h2>8. Profil publik &amp; linimasa</h2>
        <ul>
          <li>
            Jika profil Anda publik dan memiliki alamat profil (slug), member lain dapat membuka halaman linimasa Anda
            dari tautan profil — mirip alur komunitas sosial di dalam situs.
          </li>
        </ul>

        <h2>9. Privasi &amp; aturan</h2>
        <p>
          Baca <Link href="/kebijakan-privasi">Kebijakan privasi</Link> dan{" "}
          <Link href="/syarat-ketentuan">Syarat &amp; ketentuan</Link> untuk data pribadi, hak dan kewajiban, serta
          batasan penggunaan layanan.
        </p>

        <p className="text-xs text-broker-muted/90">
          Fitur dan tampilan dapat diperbarui. Jika suatu tautan atau menu tidak tersedia di akun Anda, kemungkinan
          fitur tersebut sedang dinonaktifkan atau belum memenuhi syarat penggunaan.
        </p>
      </div>
    </div>
  );
}
