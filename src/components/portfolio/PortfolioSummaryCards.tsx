import clsx from "clsx";
import type { RangeSummaryMetrics } from "@/lib/mt5SummaryRange";

function fmtNum(n: number | null | undefined, maxFrac = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("id-ID", { maximumFractionDigits: maxFrac });
}

function fmtPct(n: number | null | undefined, maxFrac = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("id-ID", { maximumFractionDigits: maxFrac })}%`;
}

function signedClass(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-broker-danger";
  return "text-broker-muted";
}

function Card({
  title,
  main,
  mainClass,
  lines,
}: {
  title: string;
  main: string;
  mainClass?: string;
  lines: { label: string; value: string; valueClass?: string }[];
}) {
  return (
    <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-broker-muted">{title}</p>
      <p className={clsx("mt-2 font-mono text-xl font-semibold sm:text-2xl", mainClass ?? "text-white")}>{main}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-broker-muted">
        {lines.map((l) => (
          <li key={l.label} className="flex justify-between gap-2">
            <span>{l.label}</span>
            <span className={clsx("font-mono text-white", l.valueClass)}>{l.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  rangeLabel: string;
  metrics: RangeSummaryMetrics;
  balance: number | null;
  equity: number | null;
};

export function PortfolioSummaryCards({ rangeLabel, metrics, balance, equity }: Props) {
  const pf =
    metrics.profitFactor != null
      ? metrics.profitFactor.toLocaleString("id-ID", { maximumFractionDigits: 2 })
      : metrics.grossLossAbs === 0 && metrics.grossProfit > 0
        ? "∞"
        : "—";

  return (
    <div className="space-y-3">
      <p className="text-xs text-broker-muted">
        Periode: <span className="font-medium text-white">{rangeLabel}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card
          title="Saldo & equity"
          main={
            balance != null && Number.isFinite(balance)
              ? fmtNum(balance, 2)
              : "—"
          }
          mainClass={balance != null ? "text-white" : "text-broker-muted"}
          lines={[
            {
              label: "Equity (snapshot)",
              value: equity != null && Number.isFinite(equity) ? fmtNum(equity, 2) : "—",
            },
            { label: "Catatan", value: "Dari snapshot terakhir ≤ akhir periode" },
          ]}
        />
        <Card
          title="Net P/L"
          main={fmtNum(metrics.netPl, 2)}
          mainClass={signedClass(metrics.netPl)}
          lines={[
            { label: "Trade penutupan", value: String(metrics.closedTrades) },
            {
              label: "Sumber",
              value: "OUT / OUT_BY",
            },
          ]}
        />
        <Card
          title="Win rate"
          main={fmtPct(metrics.winRatePct, 2)}
          lines={[
            { label: "Long", value: String(metrics.longs) },
            { label: "Short", value: String(metrics.shorts) },
            {
              label: "Menang / kalah",
              value: `${metrics.wins} / ${metrics.losses}`,
            },
          ]}
        />
        <Card
          title="Profit factor"
          main={pf}
          lines={[
            {
              label: "Laba kotor",
              value: fmtNum(metrics.grossProfit, 2),
              valueClass: "text-emerald-400",
            },
            {
              label: "Rugi kotor",
              value: fmtNum(-metrics.grossLossAbs, 2),
              valueClass: "text-broker-danger",
            },
          ]}
        />
        <Card
          title="Expectancy"
          main={metrics.expectancy == null ? "—" : fmtNum(metrics.expectancy, 2)}
          lines={[
            {
              label: "Trade terbaik",
              value: metrics.bestTrade == null ? "—" : fmtNum(metrics.bestTrade, 2),
              valueClass: metrics.bestTrade != null ? signedClass(metrics.bestTrade) : undefined,
            },
            {
              label: "Trade terburuk",
              value: metrics.worstTrade == null ? "—" : fmtNum(metrics.worstTrade, 2),
              valueClass: metrics.worstTrade != null ? signedClass(metrics.worstTrade) : undefined,
            },
          ]}
        />
      </div>
    </div>
  );
}
