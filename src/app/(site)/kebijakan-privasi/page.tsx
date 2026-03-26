import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — GMR FX",
  description:
    "Kebijakan privasi GMR FX: pengumpulan data, penggunaan, penyimpanan, dan hak pengguna layanan edukasi & komunitas.",
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs text-broker-muted">
        <Link href="/" className="text-broker-accent hover:underline">
          ← Beranda
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-white">Kebijakan Privasi</h1>
      <p className="mt-2 text-sm text-broker-muted">Berlaku efektif: {new Date().getFullYear()}</p>

      <div className="prose prose-invert prose-sm mt-8 max-w-none prose-headings:font-semibold prose-headings:text-white prose-p:text-broker-muted prose-li:text-broker-muted prose-strong:text-zinc-200">
        <p>
          GMR FX (&quot;kami&quot;) menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami
          mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi saat Anda menggunakan
          situs web dan layanan terkait (secara bersama-sama, &quot;Layanan&quot;).
        </p>

        <h2>1. Ruang lingkup</h2>
        <p>
          Kebijakan ini berlaku untuk pengunjung, pendaftar, dan anggota yang mengakses fitur seperti
          artikel, galeri, profil member, komunikasi antar pengguna, serta fitur yang tersedia dari
          waktu ke waktu.
        </p>

        <h2>2. Data yang dapat kami kumpulkan</h2>
        <ul>
          <li>
            <strong>Data akun:</strong> nama, alamat email, nomor WhatsApp, dan data profil yang Anda
            berikan saat mendaftar atau melengkapi profil.
          </li>
          <li>
            <strong>Data otentikasi:</strong> jika Anda login dengan penyedia pihak ketiga (misalnya
            Google), kami dapat menerima pengenal akun dan email sesuai izin yang Anda berikan kepada
            penyedia tersebut.
          </li>
          <li>
            <strong>Data penggunaan:</strong> informasi teknis seperti alamat IP, jenis peramban,
            waktu akses, dan halaman yang dikunjungi, untuk keamanan dan analitik agregat.
          </li>
          <li>
            <strong>Konten yang Anda unggah atau kirim:</strong> misalnya foto profil, status, komentar,
            artikel, atau pesan dalam fitur yang disediakan.
          </li>
          <li>
            <strong>Data dompet/transfer (jika berlaku):</strong> alamat dompet internal, riwayat transaksi
            yang relevan dengan fitur Layanan.
          </li>
        </ul>

        <h2>3. Tujuan penggunaan data</h2>
        <p>Kami menggunakan data untuk:</p>
        <ul>
          <li>Menyediakan, mengamankan, dan memelihara Layanan;</li>
          <li>Mengautentikasi pengguna dan mencegah penyalahgunaan;</li>
          <li>Berkomunikasi dengan Anda terkait akun atau layanan penting;</li>
          <li>Mematuhi kewajiban hukum yang berlaku.</li>
        </ul>

        <h2>4. Penyimpanan dan keamanan</h2>
        <p>
          Data disimpan pada infrastruktur yang kami anggap wajar secara industri. Tidak ada sistem yang
          sepenuhnya bebas risiko; kami menerapkan langkah teknis dan organisasi yang wajar untuk
          melindungi informasi Anda.
        </p>

        <h2>5. Pembagian kepada pihak ketiga</h2>
        <p>
          Kami dapat menggunakan penyedia layanan (misalnya hosting, basis data, penyimpanan file,
          otentikasi) yang memproses data atas nama kami sesuai kontrak dan keperluan operasional.
          Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk pemasaran mereka.
        </p>

        <h2>6. Cookie dan teknologi serupa</h2>
        <p>
          Kami dapat menggunakan cookie atau teknologi serupa yang diperlukan untuk sesi login,
          preferensi, atau analitik. Anda dapat mengatur peramban untuk membatasi cookie; beberapa fitur
          mungkin tidak berfungsi optimal.
        </p>

        <h2>7. Hak Anda</h2>
        <p>
          Sesuai hukum yang berlaku, Anda dapat meminta akses, koreksi, atau penghapusan data tertentu,
          atau menarik persetujuan di mana hal itu relevan. Hubungi kami melalui kontak yang tercantum
          di situs (atau email dukungan resmi jika disediakan).
        </p>

        <h2>8. Perubahan kebijakan</h2>
        <p>
          Kami dapat memperbarui Kebijakan Privasi ini. Perubahan material akan diumumkan melalui situs
          atau cara lain yang wajar. Penggunaan berkelanjutan setelah pembaruan berarti Anda menerima
          ketentuan yang diperbarui.
        </p>

        <h2>9. Kontak</h2>
        <p>
          Untuk pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui kanal resmi yang
          tercantum di situs GMR FX.
        </p>

        <p className="text-xs italic text-broker-muted/90">
          Ringkasan ini bersifat informasi umum dan bukan nasihat hukum. Sesuaikan kontak dan detail
          dengan kebijakan internal serta hukum setempat.
        </p>
      </div>
    </div>
  );
}
