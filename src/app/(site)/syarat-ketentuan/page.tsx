import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — GMR FX",
  description:
    "Syarat dan ketentuan penggunaan layanan GMR FX: edukasi, komunitas, akun member, dan batasan tanggung jawab.",
};

export default function SyaratKetentuanPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs text-broker-muted">
        <Link href="/" className="text-broker-accent hover:underline">
          ← Beranda
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-white">Syarat &amp; Ketentuan</h1>
      <p className="mt-2 text-sm text-broker-muted">Berlaku efektif: {new Date().getFullYear()}</p>

      <div className="prose prose-invert prose-sm mt-8 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-broker-muted prose-li:text-broker-muted prose-strong:text-zinc-200">
        <p>
          Selamat datang di GMR FX. Dengan mengakses atau menggunakan situs web dan layanan kami
          (&quot;Layanan&quot;), Anda menyetujui Syarat &amp; Ketentuan ini. Jika Anda tidak setuju,
          mohon tidak menggunakan Layanan.
        </p>

        <h2>1. Sifat layanan</h2>
        <p>
          GMR FX menyediakan konten edukasi, komunitas, dan fitur pendukung terkait trading. Materi di
          situs ini bersifat umum dan bukan rekomendasi investasi pribadi, bukan analisis investasi
          yang disesuaikan dengan situasi Anda, dan bukan penawaran untuk membeli atau menjual instrumen
          keuangan tertentu.
        </p>

        <h2>2. Risiko perdagangan</h2>
        <p>
          Perdagangan forex dan produk bermargin memiliki risiko tinggi. Anda dapat kehilangan modal
          melebihi setoran awal. Pastikan Anda memahami risiko dan hanya menggunakan dana yang siap Anda
          tanggung kerugiannya.
        </p>

        <h2>3. Akun dan keamanan</h2>
        <ul>
          <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun.</li>
          <li>
            Berikan informasi yang akurat saat mendaftar dan memperbarui profil sesuai ketentuan yang
            berlaku.
          </li>
          <li>
            Kami dapat menangguhkan atau menutup akun jika ada indikasi penyalahgunaan, pelanggaran
            hukum, atau pelanggaran syarat ini.
          </li>
        </ul>

        <h2>4. Perilaku pengguna</h2>
        <p>Anda setuju untuk tidak:</p>
        <ul>
          <li>Menggunakan Layanan untuk tujuan melanggar hukum atau merugikan pihak lain;</li>
          <li>Mengganggu keamanan, integritas, atau ketersediaan sistem;</li>
          <li>Mengunggah malware, spam, atau konten yang melanggar hak pihak ketiga;</li>
          <li>Menyamar sebagai orang atau entitas lain tanpa izin.</li>
        </ul>

        <h2>5. Konten pengguna</h2>
        <p>
          Anda memegang hak atas konten yang Anda kirimkan, namun memberi kami lisensi non-eksklusif
          untuk menyimpan, menampilkan, dan mendistribusikan konten tersebut sejalan dengan
          pengoperasian Layanan. Konten dapat dimoderasi sesuai kebijakan komunitas.
        </p>

        <h2>6. Ketersediaan dan perubahan</h2>
        <p>
          Kami dapat mengubah, menangguhkan, atau menghentikan fitur atau keseluruhan Layanan sewaktu-waktu.
          Kami berupaya memberi pemberitahuan wajar bila memungkinkan.
        </p>

        <h2>7. Batasan tanggung jawab</h2>
        <p>
          Sejauh diizinkan hukum, Layanan disediakan &quot;sebagaimana adanya&quot;. Kami tidak bertanggung
          jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerugian khusus yang timbul dari
          penggunaan atau ketidakmampuan menggunakan Layanan.
        </p>

        <h2>8. Hukum yang mengatur</h2>
        <p>
          Syarat ini tunduk pada hukum yang berlaku di wilayah operasional yang ditetapkan pengelola,
          kecuali ditentukan lain secara tegas.
        </p>

        <h2>9. Perubahan syarat</h2>
        <p>
          Kami dapat memperbarui Syarat &amp; Ketentuan ini. Versi terbaru akan dipublikasikan di halaman
          ini; tanggal efektif akan diperbarui sesuai kebutuhan.
        </p>

        <h2>10. Kontak</h2>
        <p>
          Untuk pertanyaan mengenai Syarat &amp; Ketentuan ini, hubungi kami melalui kanal resmi yang
          tercantum di situs GMR FX.
        </p>

        <p className="text-xs italic text-broker-muted/90">
          Dokumen ini bersifat kerangka umum. Sesuaikan dengan nasihat hukum dan kebijakan bisnis Anda.
        </p>
      </div>
    </div>
  );
}
