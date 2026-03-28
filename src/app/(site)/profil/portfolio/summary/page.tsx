import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export default function PortfolioSummaryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Ringkasan akun</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Grafik pertumbuhan, drawdown, dan tabel metrik seperti referensi — per akun MT yang terhubung.
        </p>
      </header>

      <PortfolioPlaceholderPanel title="Status koneksi EA">
        Expert Advisor di MetaTrader akan mengirim snapshot akun dan transaksi ke API situs (token unik per
        member). Setelah backend siap, nomor akun Anda muncul di menu samping dan grafik di halaman ini terisi
        otomatis.
      </PortfolioPlaceholderPanel>

      <div className="rounded-2xl border border-dashed border-broker-border/60 bg-broker-bg/30 p-8 text-center text-sm text-broker-muted">
        Area grafik (growth, balance, profit, drawdown) — placeholder hingga data historis tersedia.
      </div>

      <PortfolioPlaceholderPanel title="Tabel ringkas">
        Baris per periode (hari, minggu, bulan) dan kolom gain, profit, win rate, lots — mengikuti pola trade
        journal profesional.
      </PortfolioPlaceholderPanel>
    </div>
  );
}
