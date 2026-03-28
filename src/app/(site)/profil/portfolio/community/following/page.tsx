import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export default function PortfolioCommunityFollowingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
          Mengikuti (copy trade)
        </h1>
        <p className="mt-1 text-sm text-broker-muted">
          Akun sumber yang Anda pilih untuk disalin oleh EA di terminal Anda. Daftar kosong sampai fitur copy
          dan API siap.
        </p>
      </header>

      <div className="rounded-2xl border border-broker-border/60 bg-broker-surface/30 px-6 py-12 text-center">
        <p className="text-sm font-medium text-white">Belum ada akun yang diikuti</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-broker-muted">
          Dari menu <strong className="text-broker-accent">Komunitas → Akun</strong>, pilih akun publik lalu
          &quot;Ikuti&quot;. EA copy trade akan membaca konfigurasi ini dari server.
        </p>
      </div>

      <PortfolioPlaceholderPanel title="Rencana teknis">
        Simpan relasi member ↔ akun sumber ↔ parameter risiko di database; EA mengambil daftar via endpoint
        terautentikasi dan mengeksekusi order mirror sesuai aturan yang Anda tetapkan.
      </PortfolioPlaceholderPanel>
    </div>
  );
}
