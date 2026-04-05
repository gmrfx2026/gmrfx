import Link from "next/link";
import { getSiteName } from "@/lib/siteNameSettings";

export async function SiteFooter() {
  const siteName = await getSiteName();
  const disclaimer =
    `Perdagangan valuta asing dengan margin memiliki tingkat risiko yang tinggi, dan mungkin tidak cocok untuk semua investor. Sebelum memutuskan untuk memperdagangkan produk yang ditawarkan oleh broker, Anda harus mempertimbangkan dengan cermat tujuan, situasi keuangan, kebutuhan, dan tingkat pengalaman Anda. ${siteName} memberikan saran umum yang tidak mempertimbangkan tujuan, situasi keuangan, atau kebutuhan Anda. Isi situs web ini tidak boleh ditafsirkan sebagai nasihat pribadi. Ada kemungkinan Anda dapat mengalami kerugian melebihi dana yang Anda setorkan dan oleh karena itu, Anda tidak boleh berspekulasi dengan modal yang tidak mampu Anda rugikan. Anda harus menyadari semua risiko yang terkait dengan perdagangan dengan margin.`;
  return (
    <footer className="mt-auto border-t border-broker-border bg-broker-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-semibold text-white">{siteName}</p>
            <p className="mt-2 text-sm text-broker-muted">
              Buat Jurnal Trading kamu sekarang disini secara gratis, tingkatkan disiplin, konsistensi, dan
              profitabilitas. Evaluasi strategi secara objektif, manajemen emosi, perbaikan manajemen risiko, dan
              peningkatan kemampuan analisis teknikal/fundamental.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Menu</p>
            <ul className="mt-2 space-y-1 text-sm text-broker-muted">
              <li>
                <Link href="/" className="hover:text-broker-accent">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/artikel" className="hover:text-broker-accent">
                  Artikel
                </Link>
              </li>
              <li>
                <Link href="/berita" className="hover:text-broker-accent">
                  Berita
                </Link>
              </li>
              <li>
                <Link href="/indikator" className="hover:text-broker-accent">
                  Indikator
                </Link>
              </li>
              <li>
                <Link href="/ea" className="hover:text-broker-accent">
                  Expert Advisor (EA)
                </Link>
              </li>
              <li>
                <Link href="/profil/portfolio/community/accounts" className="hover:text-broker-accent">
                  Komunitas
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="hover:text-broker-accent">
                  Galeri
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Akun</p>
            <ul className="mt-2 space-y-1 text-sm text-broker-muted">
              <li>
                <Link href="/daftar" className="hover:text-broker-accent">
                  Daftar
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-broker-accent">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="hover:text-broker-accent">
                  Kebijakan privasi
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="hover:text-broker-accent">
                  Syarat &amp; ketentuan
                </Link>
              </li>
              <li>
                <Link href="/cara-pemakaian" className="hover:text-broker-accent">
                  Petunjuk &amp; Penggunaan
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-broker-accent">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-[10px] leading-relaxed text-broker-muted/80 md:text-[11px]">
          {disclaimer}
        </p>
        <p className="mt-4 text-center text-xs text-broker-muted">
          © {new Date().getFullYear()} {siteName}. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
