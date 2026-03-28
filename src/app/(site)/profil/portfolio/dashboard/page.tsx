import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export default function PortfolioDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Ringkasan kinerja akun MetaTrader — data diisi setelah EA mengirim log ke server.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Saldo", v: "—", sub: "Equity / floating menyusul" },
          { k: "Net PnL", v: "—", sub: "Total transaksi: —" },
          { k: "Win rate", v: "—", sub: "Long / short menyusul" },
          { k: "Profit factor", v: "—", sub: "Menang / kalah menyusul" },
        ].map((card) => (
          <div
            key={card.k}
            className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-broker-muted">{card.k}</p>
            <p className="mt-2 font-mono text-lg font-semibold text-white">{card.v}</p>
            <p className="mt-1 text-xs text-broker-muted/80">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <PortfolioPlaceholderPanel title="Kalender aktivitas">
          Grid harian (hijau merah sesuai PnL) akan ditampilkan di sini. Sumber data: agregasi dari trade log
          per tanggal.
        </PortfolioPlaceholderPanel>
        <PortfolioPlaceholderPanel title="Berita & jadwal">
          Widget ringkas (opsional) untuk event ekonomi — bisa dihubungkan ke feed nanti.
        </PortfolioPlaceholderPanel>
      </div>
    </div>
  );
}
