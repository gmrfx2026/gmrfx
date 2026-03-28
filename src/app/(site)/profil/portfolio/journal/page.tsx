import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export default function PortfolioJournalPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Jurnal</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Kalender + ringkasan harian dan daftar transaksi per tanggal (mirip alur FXer), dengan tema gelap GMR
          FX.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,14rem)_1fr]">
        <PortfolioPlaceholderPanel title="Kalender">
          Hari dengan profit / loss akan diberi latar hijau atau merah lembut setelah data dari MT masuk.
        </PortfolioPlaceholderPanel>
        <PortfolioPlaceholderPanel title="Detail hari terpilih">
          Net PnL, jumlah trade, long/short, win rate, dan tabel posisi untuk tanggal yang dipilih.
        </PortfolioPlaceholderPanel>
      </div>
    </div>
  );
}
