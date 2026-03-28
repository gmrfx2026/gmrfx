import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export default function PortfolioTradeLogPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Trade log</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Filter akun, rentang tanggal, simbol, magic, komentar — lalu tabel historis lengkap dari MT.
        </p>
      </header>

      <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-broker-muted">Filter (placeholder)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Akun", "Rentang tanggal", "Simbol", "Magic", "Komentar", "Segarkan"].map((x) => (
            <span
              key={x}
              className="rounded-lg border border-broker-border/60 bg-broker-bg/40 px-3 py-1.5 text-xs text-broker-muted"
            >
              {x}
            </span>
          ))}
        </div>
      </div>

      <PortfolioPlaceholderPanel title="Tabel transaksi">
        Kolom: simbol, tipe, waktu tutup, lot, swap, komisi, net PnL, durasi, magic, komentar, catatan — sama
        seperti yang Anda rencanakan dari EA.
      </PortfolioPlaceholderPanel>
    </div>
  );
}
