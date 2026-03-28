import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";

export default function PortfolioPlaybookPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Playbook</h1>
        <p className="mt-1 text-sm text-broker-muted">Aturan, checklist, dan catatan strategi trading Anda.</p>
      </header>

      <PortfolioPlaceholderPanel title="Menyusul">
        Editor catatan strategi (setup, risk, indikator) bisa ditambahkan di fase berikutnya.
      </PortfolioPlaceholderPanel>
    </div>
  );
}
