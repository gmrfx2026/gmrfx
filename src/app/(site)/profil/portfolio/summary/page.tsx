import { headers } from "next/headers";
import { Mt5TokenPanel } from "@/components/portfolio/Mt5TokenPanel";
import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export const dynamic = "force-dynamic";

function siteOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default function PortfolioSummaryPage() {
  const origin = siteOrigin();
  const ingestPath = `${origin}/api/mt5/ingest`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Ringkasan akun</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Grafik pertumbuhan, drawdown, dan tabel metrik — setelah data dari EA terkumpul.
        </p>
      </header>

      <Mt5TokenPanel ingestPath={ingestPath} />

      <PortfolioPlaceholderPanel title="Status koneksi EA">
        Pasang <strong className="text-white">GMRFX_TradeLogger.mq5</strong> dari folder{" "}
        <code className="text-broker-accent">mql5/</code> di repositori. Setelah token valid dan URL
        diizinkan di MT5, deal tersimpan di server untuk halaman trade log &amp; jurnal (UI menyusul).
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
