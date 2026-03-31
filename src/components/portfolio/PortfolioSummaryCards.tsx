import clsx from "clsx";
import type { RangeSummaryMetrics } from "@/lib/mt5SummaryRange";
import { PortfolioAccountBrokerLine } from "@/components/portfolio/PortfolioAccountBrokerLine";

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
    <div className="flex min-w-0 flex-col rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-broker-muted">{title}</p>
      <p
        className={clsx(
          "mt-2 min-w-0 max-w-full [overflow-wrap:anywhere] font-mono text-base font-semibold leading-snug tracking-tight",
          "sm:text-lg lg:text-xl xl:text-xl 2xl:text-2xl",
          mainClass ?? "text-white"
        )}
      >
        {main}
      </p>
      <ul className="mt-3 flex flex-1 flex-col gap-2.5 border-t border-broker-border/40 pt-3">
        {lines.map((l) => (
          <li key={l.label} className="min-w-0">
            <p className="text-[11px] leading-snug text-broker-muted">{l.label}</p>
            <p
              className={clsx(
                "mt-0.5 [overflow-wrap:anywhere] font-mono text-xs leading-snug text-white sm:text-sm",
                l.valueClass
              )}
            >
              {l.value}
            </p>
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
  /** Kode mata uang deposit dari MetaTrader (snapshot). */
  accountCurrency?: string | null;
  brokerName?: string | null;
  brokerServer?: string | null;
};

export function PortfolioSummaryCards({
  rangeLabel,
  metrics,
  balance,
  equity,
  accountCurrency,
  brokerName,
  brokerServer,
}: Props) {
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
      <PortfolioAccountBrokerLine
        brokerName={brokerName}
        brokerServer={brokerServer}
        explainIfMissing
        className="mt-1"
      />

      {/* minmax: lebar kartu cukup untuk angka panjang; baris bertambah otomatis */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr))" }}
      >
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
          ]}
        />
        <Card
          title="Net P/L"
          main={fmtNum(metrics.netPl, 2)}
          mainClass={signedClass(metrics.netPl)}
          lines={[
            { label: "Trade penutupan", value: String(metrics.closedTrades) },
            {
              label: "Sumber data",
              value: "Deal OUT / OUT_BY",
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

      <p className="text-[11px] leading-relaxed text-broker-muted/85">
        <span className="font-medium text-broker-muted">Saldo &amp; equity:</span> nilai dari{" "}
        <strong className="text-broker-muted">snapshot terakhir</strong> yang tercatat pada atau sebelum akhir rentang
        periode (zona WIB).
        {accountCurrency ? (
          <>
            {" "}
            <span className="font-medium text-broker-muted">Nominal</span> profit, komisi, swap, dan saldo mengikuti
            mata uang akun MetaTrader: <strong className="text-white">{accountCurrency}</strong>.
          </>
        ) : (
          <>
            {" "}
            Untuk menampilkan kode mata uang (mis. USD/IDR), gunakan EA terbaru yang mengirim{" "}
            <span className="font-mono text-[10px] text-broker-muted">account.currency</span>.
          </>
        )}
      </p>
    </div>
  );
}
