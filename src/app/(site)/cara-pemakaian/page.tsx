import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Petunjuk & Penggunaan — GMR FX",
  description:
    "Panduan lengkap untuk member GMR FX: akun, wallet, deposit USDT, marketplace, portofolio MetaTrader, copy trading EA, komunitas, dan aturan penggunaan.",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-broker-accent/20 text-xs font-bold text-broker-accent">
          #
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-broker-muted">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      <div className="mt-1.5 space-y-1">{children}</div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-broker-accent/60" />
      <span>{children}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-broker-accent/20 bg-broker-accent/5 px-3 py-2.5 text-xs text-broker-muted">
      {children}
    </div>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2.5 text-xs text-amber-300">
      {children}
    </div>
  );
}

const TOC = [
  { id: "akun",       label: "Daftar, masuk & profil" },
  { id: "wallet",     label: "Wallet & saldo IDR" },
  { id: "deposit",    label: "Deposit USDT (BSC)" },
  { id: "marketplace",label: "Marketplace Indikator & EA" },
  { id: "portofolio", label: "Portofolio MetaTrader" },
  { id: "komunitas",  label: "Komunitas & copy trading" },
  { id: "ea-setup",   label: "Cara pasang EA (Logger & CopyTrader)" },
  { id: "sosial",     label: "Artikel, berita & profil publik" },
  { id: "privasi",    label: "Privasi & aturan" },
];

export default function CaraPemakaianPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Breadcrumb */}
      <p className="text-xs text-broker-muted">
        <Link href="/" className="text-broker-accent hover:underline">← Beranda</Link>
        {" · "}
        <Link href="/faq" className="text-broker-accent hover:underline">FAQ</Link>
      </p>

      <h1 className="mt-4 text-2xl font-bold text-white">Petunjuk &amp; Penggunaan</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Panduan lengkap untuk <strong className="text-zinc-300">member</strong>. Untuk pertanyaan singkat lihat juga{" "}
        <Link href="/faq" className="text-broker-accent hover:underline">FAQ</Link>.
      </p>

      {/* Table of contents */}
      <nav className="mt-6 rounded-xl border border-broker-border/60 bg-broker-surface/30 px-4 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-broker-muted">Daftar isi</p>
        <ol className="grid gap-1 sm:grid-cols-2">
          {TOC.map((t, i) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="flex items-center gap-1.5 text-sm text-broker-muted hover:text-broker-accent"
              >
                <span className="text-xs text-broker-accent/60">{i + 1}.</span>
                {t.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">

        {/* 1. Akun */}
        <Section id="akun" title="Daftar, masuk & profil">
          <Li>
            Buat akun lewat <Link href="/daftar" className="text-broker-accent hover:underline">Daftar</Link>, lalu
            masuk lewat <Link href="/login" className="text-broker-accent hover:underline">Login</Link> (email/password
            atau Google).
          </Li>
          <Li>
            Jika diminta, lengkapi data di{" "}
            <Link href="/lengkapi-profil" className="text-broker-accent hover:underline">Lengkapi profil</Link> agar
            fitur komunitas dan profil publik dapat dipakai.
          </Li>
          <Li>
            Setelah login, semua fitur diakses dari{" "}
            <Link href="/profil" className="text-broker-accent hover:underline">Dashboard member</Link> — pilih menu di
            sidebar kiri (desktop) atau tombol bawah layar (mobile).
          </Li>
        </Section>

        {/* 2. Wallet */}
        <Section id="wallet" title="Wallet & saldo IDR">
          <p>
            Saldo Anda tersimpan dalam <strong className="text-zinc-300">Rupiah (IDR)</strong> di platform dan dipakai
            untuk berlangganan fitur berbayar serta pembelian di marketplace.
          </p>
          <Sub title="Melihat saldo">
            <Li>
              Buka <Link href="/profil?tab=wallet" className="text-broker-accent hover:underline">Profil → Wallet &amp; Transfer</Link>.
              Saldo IDR tampil di kartu utama dashboard.
            </Li>
          </Sub>
          <Sub title="Transfer antar member">
            <Li>
              Di tab Wallet, gunakan form transfer: masukkan alamat wallet tujuan, jumlah, dan catatan. Transaksi masuk
              ke riwayat transfer kedua pihak.
            </Li>
          </Sub>
          <Sub title="Cara mengisi saldo">
            <Li>
              Deposit menggunakan <strong className="text-zinc-300">USDT (BSC/BEP-20)</strong> — lihat panduan
              lengkapnya di bagian <a href="#deposit" className="text-broker-accent hover:underline">Deposit USDT</a> di
              bawah.
            </Li>
          </Sub>
          <Sub title="Escrow pembelian">
            <Li>
              Pembelian produk berbayar ditahan sementara (escrow). Pembeli mengonfirmasi penerimaan atau mengajukan
              komplain; penjual memantau status pencairan di Wallet.
            </Li>
          </Sub>
        </Section>

        {/* 3. Deposit USDT */}
        <Section id="deposit" title="Deposit USDT (BSC / BEP-20)">
          <p>
            Isi saldo IDR dengan mentransfer <strong className="text-zinc-300">USDT</strong> ke alamat wallet admin.
            Setelah dikonfirmasi on-chain, saldo langsung dikreditkan otomatis dengan kurs real-time.
          </p>

          <Sub title="Langkah deposit">
            <Li>
              Buka <Link href="/profil?tab=wallet" className="text-broker-accent hover:underline">Profil → Wallet</Link>, lalu
              scroll ke seksi <strong className="text-zinc-300">Deposit USDT</strong>.
            </Li>
            <Li>
              Salin <strong className="text-zinc-300">alamat BSC admin</strong> yang ditampilkan atau scan QR code
              menggunakan Trust Wallet / dompet kripto lainnya.
            </Li>
            <Li>
              Di Trust Wallet: pilih <em>Send</em> → pilih token{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">USDT (BNB Smart Chain)</code> → tempel
              alamat admin → masukkan jumlah → konfirmasi.
            </Li>
            <Li>
              Setelah TX berhasil, salin <strong className="text-zinc-300">TxHash</strong> dari Trust Wallet (Riwayat →
              pilih TX → Lihat di Explorer → salin hash) atau dari BSCScan.
            </Li>
            <Li>
              Tempel TxHash di kolom konfirmasi → klik <strong className="text-zinc-300">Konfirmasi</strong>. Saldo IDR
              langsung dikreditkan.
            </Li>
          </Sub>

          <Sub title="Cara mendapatkan TxHash di Trust Wallet">
            <Li>Buka Trust Wallet → token USDT (BNB Smart Chain).</Li>
            <Li>Pilih transaksi yang baru dikirim → klik <em>Lihat di Explorer</em>.</Li>
            <Li>
              Di halaman BSCScan, salin hash panjang di bagian atas (diawali{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">0x</code>).
            </Li>
            <Li>Tempel di form konfirmasi deposit.</Li>
          </Sub>

          <Warn>
            <strong>⚠ Penting:</strong> Hanya kirim token <strong>USDT</strong> di jaringan{" "}
            <strong>BSC (BEP-20 / BNB Smart Chain)</strong>. Mengirim token lain atau jaringan lain akan{" "}
            <strong>hilang permanen</strong> dan tidak dapat dikembalikan. Konfirmasi jaringan di Trust Wallet sebelum
            mengirim.
          </Warn>

          <Note>
            Kurs USDT/IDR diambil secara real-time. Satu TxHash hanya bisa dikreditkan satu kali. Minimal deposit 1
            USDT.
          </Note>

          <Sub title="Mengatur Trust Wallet untuk MetaTrader">
            <Li>
              Trust Wallet juga dipakai untuk menyimpan USDT sebelum deposit — tidak ada integrasi langsung antara Trust
              Wallet dan MetaTrader EA. EA berkomunikasi ke server GMR FX, bukan ke dompet kripto.
            </Li>
          </Sub>
        </Section>

        {/* 4. Marketplace */}
        <Section id="marketplace" title="Marketplace Indikator & EA">
          <Sub title="Membeli produk">
            <Li>
              Jelajahi <Link href="/indikator" className="text-broker-accent hover:underline">Indikator</Link> dan{" "}
              <Link href="/ea" className="text-broker-accent hover:underline">Expert Advisor</Link>. Produk gratis
              langsung diunduh setelah login; produk berbayar memotong saldo wallet Anda.
            </Li>
          </Sub>
          <Sub title="Menjual produk">
            <Li>
              Dari dashboard member, buka tab <strong className="text-zinc-300">Indikator</strong> atau{" "}
              <strong className="text-zinc-300">Expert (EA)</strong> untuk mengunggah file, menentukan harga, dan
              mempublikasikan produk.
            </Li>
          </Sub>
        </Section>

        {/* 5. Portofolio */}
        <Section id="portofolio" title="Portofolio MetaTrader">
          <p>
            Hubungkan terminal MetaTrader ke situs menggunakan <strong className="text-zinc-300">token EA</strong> (bukan
            password broker). EA mengirim data deal &amp; snapshot saldo ke server GMR FX secara berkala.
          </p>
          <Sub title="Membuat token &amp; menghubungkan akun">
            <Li>
              Buka{" "}
              <Link href="/profil/portfolio/dashboard" className="text-broker-accent hover:underline">
                Portofolio → Dashboard
              </Link>
              . Klik <strong className="text-zinc-300">Buat token baru</strong>, simpan token (hanya tampil sekali).
            </Li>
            <Li>
              Download EA <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">GMRFX_TradeLogger</code> dari
              link download yang tersedia di halaman Dashboard, lalu pasang di MetaTrader.
            </Li>
            <Li>
              Isi parameter <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">InpApiToken</code> dengan
              token yang baru dibuat, dan izinkan URL{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">https://gmrfx.app</code> di MetaTrader →
              Tools → Options → Expert Advisors.
            </Li>
            <Li>
              Setelah EA aktif dan mengirim data, akun MetaTrader muncul di daftar portofolio. Periksa{" "}
              <Link href="/profil/portfolio/trade-log" className="text-broker-accent hover:underline">Trade log</Link>{" "}
              untuk memastikan data masuk.
            </Li>
          </Sub>
          <Sub title="Halaman portofolio">
            <Li>
              <Link href="/profil/portfolio/summary" className="text-broker-accent hover:underline">Ringkasan</Link> —
              angka kinerja per rentang tanggal.
            </Li>
            <Li>
              <Link href="/profil/portfolio/journal" className="text-broker-accent hover:underline">Jurnal</Link> —
              tampilan kalender deal penutupan.
            </Li>
            <Li>
              <Link href="/profil/portfolio/trade-log" className="text-broker-accent hover:underline">Trade log</Link> —
              tabel riwayat deal.
            </Li>
            <Li>
              <Link href="/profil/portfolio/playbook" className="text-broker-accent hover:underline">Playbook</Link> —
              catatan strategi trading Anda.
            </Li>
          </Sub>
        </Section>

        {/* 6. Komunitas copy trading */}
        <Section id="komunitas" title="Komunitas & copy trading">
          <Sub title="Sebagai publisher (trader yang diikuti)">
            <Li>
              Buka{" "}
              <Link href="/profil/portfolio/community/publish" className="text-broker-accent hover:underline">
                Komunitas → Publikasi
              </Link>
              . Aktifkan <strong className="text-zinc-300">Izinkan Copy</strong> dan atur harga (0 = gratis).
            </Li>
            <Li>
              Pasang EA <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">GMRFX_TradeLogger</code> di
              akun MetaTrader Anda. EA ini yang mengirim data posisi terbuka ke server agar copier bisa menyalinnya.
            </Li>
            <Li>
              Pantau daftar pengikut di{" "}
              <Link href="/profil/portfolio/community/pengikut" className="text-broker-accent hover:underline">
                Komunitas → Pengikut
              </Link>
              .
            </Li>
          </Sub>

          <Sub title="Sebagai copier (mengikuti/copy trader lain)">
            <Li>
              Temukan akun publisher di{" "}
              <Link href="/profil/portfolio/community/accounts" className="text-broker-accent hover:underline">
                Komunitas → Akun
              </Link>
              , lalu klik <strong className="text-zinc-300">Copy</strong> di profil publisher.
            </Li>
            <Li>
              Setelah berlangganan, <strong className="text-zinc-300">token unik</strong> untuk publisher tersebut
              ditampilkan <em>sekali</em>. Simpan segera — jika hilang, gunakan tombol{" "}
              <strong className="text-zinc-300">Regenerasi token</strong> di halaman Mengikuti.
            </Li>
            <Li>
              Buka{" "}
              <Link href="/profil/portfolio/community/following" className="text-broker-accent hover:underline">
                Komunitas → Mengikuti
              </Link>{" "}
              untuk melihat semua langganan, token aktif, dan link download EA.
            </Li>
            <Li>
              Pasang EA <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">GMRFX_CopyTrader</code> di
              chart MetaTrader Anda, isi{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">InpCopyToken</code> dengan token tersebut.
            </Li>
            <Li>
              Untuk copy beberapa publisher: pasang EA{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">GMRFX_CopyTrader</code> beberapa kali di
              chart berbeda, masing-masing dengan token dan{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">InpMagic</code> berbeda.
            </Li>
            <Li>
              Masa berlangganan copy trading adalah <strong className="text-zinc-300">30 hari</strong> (gratis maupun
              berbayar). Perpanjang dengan klik Copy lagi sebelum atau sesudah habis.
            </Li>
          </Sub>

          <Note>
            Token copy bersifat rahasia — siapa pun yang memilikinya dapat mengakses data posisi publisher tersebut
            untuk akun Anda. Jangan bagikan ke orang lain. Regenerasi token akan membatalkan token lama seketika.
          </Note>
        </Section>

        {/* 7. Cara pasang EA */}
        <Section id="ea-setup" title="Cara pasang EA (TradeLogger & CopyTrader)">
          <Sub title="Persyaratan umum">
            <Li>MetaTrader 4 atau MetaTrader 5 (versi baru yang mendukung WebRequest).</Li>
            <Li>
              Di MetaTrader: buka <em>Tools → Options → Expert Advisors</em> → centang{" "}
              <strong className="text-zinc-300">Allow WebRequest for listed URL</strong> → tambahkan{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">https://gmrfx.app</code>. Ini berlaku
              untuk <em>semua</em> EA GMR FX (cukup satu kali per terminal).
            </Li>
          </Sub>

          <Sub title="Download file EA">
            <Li>
              File EA tersedia di halaman{" "}
              <Link href="/profil/portfolio/dashboard" className="text-broker-accent hover:underline">
                Dashboard Portofolio
              </Link>{" "}
              (untuk TradeLogger) dan{" "}
              <Link href="/profil/portfolio/community/following" className="text-broker-accent hover:underline">
                Komunitas → Mengikuti
              </Link>{" "}
              (untuk CopyTrader) — keduanya tersimpan di Google Drive.
            </Li>
            <Li>
              Download file <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">.mq5</code> (MT5) atau{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">.mq4</code> (MT4), letakkan di folder{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">MQL5/Experts</code> atau{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">MQL4/Experts</code> MetaTrader, lalu
              compile (F7 di MetaEditor).
            </Li>
          </Sub>

          <Sub title="GMRFX_TradeLogger — untuk publisher / portofolio">
            <Li>
              Pasang di chart manapun → isi{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">InpApiToken</code> dengan token dari
              Dashboard Portofolio.
            </Li>
            <Li>
              EA mengirim data deal historis + posisi terbuka secara berkala (OnTimer) dan instan saat ada perubahan
              posisi (OnTrade). Endpoint yang digunakan:{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">
                https://gmrfx.app/api/mt5/ingest
              </code>{" "}
              (MT5) atau <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">/api/mt4/ingest</code> (MT4).
            </Li>
          </Sub>

          <Sub title="GMRFX_CopyTrader — untuk copier">
            <Li>
              Pasang di chart manapun → isi{" "}
              <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">InpCopyToken</code> dengan token dari
              halaman Mengikuti.
            </Li>
            <Li>
              Atur <code className="rounded bg-broker-bg/60 px-1 text-emerald-400">InpMagic</code> (angka unik per
              publisher), mode volume (fixed lot atau proporsional), dan opsi sinkronisasi SL/TP/close.
            </Li>
            <Li>EA polling setiap ~2 detik dan langsung resync jika ada perubahan posisi lokal.</Li>
          </Sub>

          <Warn>
            <strong>Satu token = satu publisher.</strong> Untuk copy dari banyak publisher, pasang beberapa instance EA
            di chart berbeda dengan token dan magic number masing-masing.
          </Warn>
        </Section>

        {/* 8. Sosial */}
        <Section id="sosial" title="Artikel, berita & profil publik">
          <Li>
            <Link href="/artikel" className="text-broker-accent hover:underline">Artikel</Link> — baca materi edukasi;
            tulis artikel dari dashboard member jika diizinkan.
          </Li>
          <Li>
            <Link href="/berita" className="text-broker-accent hover:underline">Berita</Link> — berita dalam negeri dan
            internasional yang disajikan situs.
          </Li>
          <Li>
            <Link href="/galeri" className="text-broker-accent hover:underline">Galeri</Link> — kumpulan gambar yang
            dipublikasikan.
          </Li>
          <Li>
            Jika profil Anda publik dan memiliki alamat profil (slug), member lain dapat membuka halaman linimasa Anda —
            mirip profil sosial di dalam situs.
          </Li>
        </Section>

        {/* 9. Privasi */}
        <Section id="privasi" title="Privasi & aturan">
          <p>
            Baca{" "}
            <Link href="/kebijakan-privasi" className="text-broker-accent hover:underline">Kebijakan privasi</Link> dan{" "}
            <Link href="/syarat-ketentuan" className="text-broker-accent hover:underline">
              Syarat &amp; ketentuan
            </Link>{" "}
            untuk data pribadi, hak dan kewajiban, serta batasan penggunaan layanan.
          </p>
          <Note>
            Fitur dan tampilan dapat diperbarui sewaktu-waktu. Jika suatu menu tidak tersedia, kemungkinan fitur tersebut
            sedang dinonaktifkan oleh admin atau belum memenuhi syarat penggunaan.
          </Note>
        </Section>

      </div>
    </div>
  );
}
