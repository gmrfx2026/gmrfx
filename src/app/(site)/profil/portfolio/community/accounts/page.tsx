import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

const DEMO_ROWS = [
  {
    name: "Contoh — XAU Trend",
    platform: "MetaTrader 5",
    mode: "Demo",
    method: "EA",
    gain: "—",
    daily: "—",
    dd: "—",
    balance: "—",
    pnl: "—",
  },
  {
    name: "Contoh — Manual IDR",
    platform: "MetaTrader 4",
    mode: "Real",
    method: "Manual",
    gain: "—",
    daily: "—",
    dd: "—",
    balance: "—",
    pnl: "—",
  },
];

export default function PortfolioCommunityAccountsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Akun komunitas</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Daftar akun trading yang dipublikasikan ke komunitas. Tombol ikuti akan terhubung ke alur copy trade
          (EA) di fase berikutnya.
        </p>
      </header>

      <PortfolioPlaceholderPanel title="Data nyata">
        Baris di bawah hanya contoh tata letak. Nanti diisi dari database (akun terhubung ke website + izin
        publik).
      </PortfolioPlaceholderPanel>

      <div className="overflow-x-auto rounded-2xl border border-broker-border/80 bg-broker-surface/40 shadow-inner shadow-black/20">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-broker-border/80 bg-broker-bg/40 text-xs uppercase tracking-wide text-broker-muted">
              <th className="px-3 py-3 font-medium">Nama</th>
              <th className="px-3 py-3 font-medium">Platform</th>
              <th className="px-3 py-3 font-medium">Mode</th>
              <th className="px-3 py-3 font-medium">Metode</th>
              <th className="px-3 py-3 font-medium">Gain</th>
              <th className="px-3 py-3 font-medium">Harian</th>
              <th className="px-3 py-3 font-medium">Drawdown</th>
              <th className="px-3 py-3 font-medium">Saldo</th>
              <th className="px-3 py-3 font-medium">Net PnL</th>
              <th className="px-3 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ROWS.map((r) => (
              <tr key={r.name} className="border-b border-broker-border/40 text-broker-muted last:border-0">
                <td className="px-3 py-2.5 font-medium text-broker-accent/90">{r.name}</td>
                <td className="px-3 py-2.5">{r.platform}</td>
                <td className="px-3 py-2.5">{r.mode}</td>
                <td className="px-3 py-2.5">{r.method}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.gain}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.daily}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-broker-danger/80">{r.dd}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.balance}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.pnl}</td>
                <td className="px-3 py-2.5 text-right">
                  <span className="inline-flex gap-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-broker-border/60 px-2 py-1 text-xs text-broker-muted"
                    >
                      Ikuti
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-lg border border-broker-border/60 px-2 py-1 text-xs text-broker-muted"
                    >
                      Bandingkan
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
