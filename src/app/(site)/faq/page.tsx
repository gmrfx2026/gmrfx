import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ — GMR FX",
  description:
    "Pertanyaan yang sering diajukan tentang akun, wallet, deposit USDT, copy trading EA, portofolio MetaTrader, marketplace, dan penggunaan GMR FX.",
};

type FaqItem = { q: string; a: ReactNode };

const groups: { title: string; items: FaqItem[] }[] = [
  {
    title: "Akun & Profil",
    items: [
      {
        q: "Apa itu GMR FX?",
        a: "GMR FX adalah platform edukasi dan komunitas seputar trading, dengan fitur wallet IDR, marketplace indikator/EA, portofolio MetaTrader, dan copy trading. Bukan penyedia sinyal investasi pribadi dan bukan pialang.",
      },
      {
        q: "Bagaimana cara mendaftar?",
        a: (
          <>
            Gunakan halaman <Link href="/daftar">Daftar</Link>, isi data yang diminta, lalu{" "}
            <Link href="/login">Login</Link>. Lengkapi profil bila diminta agar semua fitur terbuka.
          </>
        ),
      },
      {
        q: "Bisakah login dengan akun Google?",
        a: "Ya, tersedia opsi Login dengan Google di halaman masuk — tidak perlu membuat password terpisah.",
      },
      {
        q: "Mengapa menu tertentu tidak muncul di akun saya?",
        a: "Beberapa menu dapat dinonaktifkan oleh admin atau memerlukan syarat tertentu (misal profil lengkap). Periksa juga apakah profil Anda sudah dilengkapi di halaman Lengkapi Profil.",
      },
    ],
  },
  {
    title: "Wallet & Saldo IDR",
    items: [
      {
        q: "Apa itu saldo wallet?",
        a: (
          <>
            Saldo wallet adalah nilai dalam <strong>Rupiah (IDR)</strong> di akun Anda, dipakai untuk transfer ke
            sesama member dan pembelian produk berbayar di marketplace. Saldo dapat diisi lewat deposit USDT.
          </>
        ),
      },
      {
        q: "Bagaimana cara mengisi saldo (deposit)?",
        a: (
          <>
            Saldo diisi dengan mengirim <strong>USDT (BEP-20 / BSC)</strong> ke alamat wallet admin, lalu masukkan
            TxHash di form konfirmasi. Saldo IDR dikreditkan otomatis dengan kurs real-time. Lihat panduan lengkap di{" "}
            <Link href="/cara-pemakaian#deposit">Petunjuk → Deposit USDT</Link>.
          </>
        ),
      },
      {
        q: "Berapa lama deposit USDT masuk ke saldo?",
        a: "Biasanya instan setelah Anda memasukkan TxHash yang valid dan transaksi sudah dikonfirmasi on-chain di BSCScan. Tidak ada penundaan manual.",
      },
      {
        q: "Apakah ada biaya deposit?",
        a: "Tidak ada biaya dari sisi platform. Anda hanya membayar biaya jaringan (gas fee) BSC saat mengirim USDT, yang biasanya sangat kecil (~$0.10–$0.30).",
      },
      {
        q: "Mengapa deposit saya gagal?",
        a: (
          <>
            Beberapa kemungkinan: TxHash salah atau belum dikonfirmasi on-chain, Anda mengirim token selain USDT, atau
            jaringan yang dipakai bukan BSC (BEP-20). Pastikan jaringan di Trust Wallet adalah{" "}
            <strong>BNB Smart Chain</strong> saat mengirim. Jika yakin TX valid namun gagal, hubungi admin.
          </>
        ),
      },
      {
        q: "Jaringan apa yang didukung untuk deposit USDT?",
        a: (
          <>
            Hanya <strong>BSC (BEP-20 / BNB Smart Chain)</strong>. Jangan kirim via Ethereum (ERC-20), TRON (TRC-20),
            atau jaringan lain — dana tidak dapat dipulihkan jika salah jaringan.
          </>
        ),
      },
      {
        q: "Bagaimana cara mendapatkan TxHash di Trust Wallet?",
        a: "Buka Trust Wallet → pilih token USDT (BNB Smart Chain) → pilih transaksi yang baru dikirim → klik Lihat di Explorer → salin hash panjang (diawali 0x) dari halaman BSCScan.",
      },
      {
        q: "Bagaimana cara transfer saldo ke member lain?",
        a: (
          <>
            Buka <Link href="/profil?tab=wallet">Profil → Wallet & Transfer</Link>, isi alamat wallet tujuan, jumlah,
            dan catatan, lalu kirim.
          </>
        ),
      },
    ],
  },
  {
    title: "Marketplace Indikator & EA",
    items: [
      {
        q: "Bagaimana membeli indikator atau EA?",
        a: (
          <>
            Kunjungi <Link href="/indikator">Indikator</Link> atau <Link href="/ea">EA</Link>, buka halaman produk,
            lalu ikuti tombol beli. Produk gratis langsung diunduh; produk berbayar memotong saldo wallet Anda.
          </>
        ),
      },
      {
        q: "Mengapa dana penjual tidak langsung masuk setelah saya membeli?",
        a: "Platform memakai mekanisme escrow: dana ditahan sementara agar pembeli punya waktu memastikan produk atau mengajukan komplain. Setelah masa komplain lewat tanpa sengketa — atau setelah konfirmasi pembeli — dana mengalir ke penjual.",
      },
      {
        q: "Saya pembeli — bagaimana mengonfirmasi atau komplain?",
        a: (
          <>
            Buka <Link href="/profil?tab=wallet">Profil → Wallet</Link>. Di bagian{" "}
            <strong>Pembelian marketplace (escrow)</strong>, gunakan tombol konfirmasi jika produk sesuai, atau ajukan
            komplain jika ada masalah. Komplain ditinjau admin.
          </>
        ),
      },
      {
        q: "Berapa lama masa escrow?",
        a: "Diatur pengelola (biasanya beberapa hari). Detail untuk transaksi Anda tampil di riwayat wallet. Pencairan otomatis ke penjual dijadwalkan setelah masa tersebut lewat jika status normal.",
      },
      {
        q: "Bagaimana cara menjual produk saya?",
        a: (
          <>
            Dari dashboard member, buka tab <strong>Indikator</strong> atau <strong>Expert (EA)</strong>, unggah file,
            isi harga dan deskripsi, lalu publikasikan. Pembeli membayar menggunakan saldo wallet.
          </>
        ),
      },
    ],
  },
  {
    title: "Portofolio MetaTrader",
    items: [
      {
        q: "Bagaimana menghubungkan akun MetaTrader ke GMR FX?",
        a: (
          <>
            Buat token EA di{" "}
            <Link href="/profil/portfolio/dashboard">Portofolio → Dashboard</Link>, download EA{" "}
            <strong>GMRFX_TradeLogger</strong>, pasang di MetaTrader, isi{" "}
            <code>InpApiToken</code> dengan token tersebut. Tambahkan{" "}
            <code>https://gmrfx.app</code> ke whitelist URL di Tools → Options → Expert Advisors.
          </>
        ),
      },
      {
        q: "Apakah perlu mendaftarkan URL di MetaTrader?",
        a: (
          <>
            Ya. Semua EA GMR FX menggunakan WebRequest ke server. Tambahkan{" "}
            <strong>https://gmrfx.app</strong> (cukup domain, bukan full path) di MetaTrader → Tools → Options →
            Expert Advisors → Allow WebRequest for listed URL. Berlaku untuk MT4 maupun MT5.
          </>
        ),
      },
      {
        q: "Data apa saja yang dikirim EA ke server?",
        a: "GMRFX_TradeLogger mengirim: deal historis (HistoryDeals), posisi terbuka, order tertunda, dan snapshot saldo/equity. Tidak ada password broker yang dikirim — hanya data trading dan nomor login MetaTrader.",
      },
      {
        q: "Apakah EA aman — apakah bisa membuka/menutup posisi sendiri?",
        a: "GMRFX_TradeLogger hanya membaca dan mengirim data ke server, tidak pernah membuka atau menutup posisi. GMRFX_CopyTrader membuka/menutup posisi sesuai instruksi yang Anda izinkan lewat parameter EA.",
      },
      {
        q: "Di mana file EA bisa didownload?",
        a: (
          <>
            Link download tersedia di halaman{" "}
            <Link href="/profil/portfolio/dashboard">Dashboard Portofolio</Link> (TradeLogger) dan{" "}
            <Link href="/profil/portfolio/community/following">Komunitas → Mengikuti</Link> (CopyTrader) — file
            tersimpan di Google Drive.
          </>
        ),
      },
    ],
  },
  {
    title: "Copy Trading",
    items: [
      {
        q: "Bagaimana cara memulai copy trading?",
        a: (
          <>
            Temukan publisher di{" "}
            <Link href="/profil/portfolio/community/accounts">Komunitas → Akun</Link>, klik{" "}
            <strong>Copy</strong> → simpan token yang muncul → download EA GMRFX_CopyTrader → pasang di MetaTrader →
            isi <code>InpCopyToken</code> dengan token tersebut.
          </>
        ),
      },
      {
        q: "Apa itu token copy dan mengapa hanya tampil sekali?",
        a: "Token copy adalah kunci unik per langganan publisher. Sistem menyimpan hash-nya saja (bukan teks asli) untuk keamanan, sehingga hanya bisa ditampilkan saat pertama kali dibuat. Jika hilang, gunakan Regenerasi token di halaman Mengikuti — token lama langsung tidak berlaku.",
      },
      {
        q: "Bisakah saya copy dari beberapa publisher sekaligus?",
        a: (
          <>
            Ya. Pasang beberapa instance EA <strong>GMRFX_CopyTrader</strong> di chart berbeda, masing-masing dengan
            token publisher yang berbeda dan nilai <code>InpMagic</code> yang unik.
          </>
        ),
      },
      {
        q: "Berapa lama masa berlangganan copy trading?",
        a: "30 hari, berlaku untuk berlangganan gratis maupun berbayar. Perpanjang dengan klik tombol Copy lagi di halaman komunitas publisher.",
      },
      {
        q: "Apa perbedaan copy trading gratis dan berbayar?",
        a: "Publisher menentukan apakah copy-nya gratis (0 IDR) atau berbayar. Keduanya memiliki masa berlaku 30 hari. Untuk berbayar, saldo wallet Anda dipotong sesuai harga yang ditetapkan publisher.",
      },
      {
        q: "Berapa delay antara trade publisher dan akun saya?",
        a: "Dengan konfigurasi default (~2 detik polling + pengiriman instan saat ada perubahan posisi via OnTrade), delay biasanya 2–10 detik. Faktor tambahan: kecepatan internet, beban server, dan kondisi broker.",
      },
      {
        q: "Apakah posisi saya langsung ditutup jika publisher menutupnya?",
        a: (
          <>
            Ya, jika parameter <code>InpCopyClose</code> diaktifkan (default: aktif). EA mendeteksi posisi publisher
            hilang dan menutup posisi lokal yang sesuai.
          </>
        ),
      },
      {
        q: "Token copy saya bocor — apa yang harus dilakukan?",
        a: (
          <>
            Segera klik <strong>Regenerasi token</strong> di{" "}
            <Link href="/profil/portfolio/community/following">Komunitas → Mengikuti</Link>. Token lama dinonaktifkan
            seketika dan EA yang memakai token lama berhenti dapat data.
          </>
        ),
      },
    ],
  },
  {
    title: "Umum",
    items: [
      {
        q: "Apakah konten di situs ini rekomendasi investasi?",
        a: "Tidak. Konten bersifat edukasi dan informasi umum. Bukan nasihat investasi yang disesuaikan dengan situasi pribadi. Trading berisiko tinggi; putuskan sendiri dengan mempertimbangkan tujuan dan kemampuan finansial Anda.",
      },
      {
        q: "Di mana petunjuk penggunaan lengkap?",
        a: (
          <>
            Lihat halaman <Link href="/cara-pemakaian">Petunjuk &amp; Penggunaan</Link> untuk uraian lengkap semua
            fitur.
          </>
        ),
      },
      {
        q: "Bagaimana cara menghubungi admin?",
        a: "Gunakan kanal resmi yang tersedia di situs (menu Kontak atau komunitas). Admin tidak meminta password atau token melalui pesan pribadi.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs text-broker-muted">
        <Link href="/" className="text-broker-accent hover:underline">← Beranda</Link>
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
        ,{" "}
        <Link href="/syarat-ketentuan" className="text-broker-accent hover:underline">
          Syarat &amp; ketentuan
        </Link>
        , atau hubungi pengelola melalui kanal resmi.
      </p>

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-broker-accent">
              <span className="h-px flex-1 bg-broker-accent/20" />
              {group.title}
              <span className="h-px flex-1 bg-broker-accent/20" />
            </h2>
            <div className="space-y-2">
              {group.items.map((it) => (
                <details
                  key={it.q}
                  className="group rounded-lg border border-broker-border bg-broker-surface/30 open:border-broker-accent/30 open:bg-broker-surface/45"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-2">
                      <span>{it.q}</span>
                      <span className="shrink-0 text-broker-muted transition-transform group-open:rotate-180">▼</span>
                    </span>
                  </summary>
                  <div className="border-t border-broker-border/60 px-4 py-3 text-sm leading-relaxed text-broker-muted prose prose-invert prose-sm max-w-none prose-a:text-broker-accent prose-code:rounded prose-code:bg-broker-bg/60 prose-code:px-1 prose-code:text-emerald-400">
                    <p className="m-0">{it.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-broker-muted/70">
        Konten FAQ dapat diperbarui seiring penambahan fitur. Terakhir diperbarui mengikuti versi platform saat ini.
      </p>
    </div>
  );
}
