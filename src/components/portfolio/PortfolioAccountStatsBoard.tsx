"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioStatsModel } from "@/lib/mt5Stats";
import type { TradingActivityView } from "@/lib/mtTradingActivity";
import { mtPendingOrderTypeLabel } from "@/lib/mtTradingActivity";
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

function formatDurationFromOpen(openUnixSec: number, ref: Date): string {
  const fromMs = openUnixSec * 1000;
  let ms = ref.getTime() - fromMs;
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${mins} mnt`;
  if (mins > 0) return `${mins} mnt`;
  return "<1 mnt";
}

function fmtLevel(n: number | null | undefined, frac = 5): string {
  if (n == null || !Number.isFinite(n) || n === 0) return "—";
  return n.toLocaleString("id-ID", { maximumFractionDigits: frac });
}

function sideLabel(side: number): string {
  return side === 0 ? "Buy" : side === 1 ? "Sell" : `Tipe ${side}`;
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition sm:px-3 sm:text-xs",
        active
          ? "bg-broker-accent/20 text-broker-accent ring-1 ring-broker-accent/40"
          : "text-broker-muted hover:bg-broker-bg/60 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  valueClass,
  sub,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-broker-border/80 bg-broker-surface/50 p-3 shadow-sm sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-broker-muted sm:text-xs">{label}</p>
      <p className={clsx("mt-1.5 font-mono text-base font-semibold sm:text-lg", valueClass ?? "text-white")}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-[10px] text-broker-muted/80 sm:text-xs">{sub}</p> : null}
    </div>
  );
}

function SidebarRow({ k, v, vClass }: { k: string; v: string; vClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-broker-border/40 py-2 text-xs last:border-0">
      <span className="text-broker-muted">{k}</span>
      <span className={clsx("max-w-[60%] text-right font-mono text-[11px] sm:text-xs", vClass ?? "text-white")}>
        {v}
      </span>
    </div>
  );
}

const CHART_TABS = [
  { id: "growth" as const, label: "Pertumbuhan" },
  { id: "balance" as const, label: "Saldo" },
  { id: "profit" as const, label: "Profit harian" },
  { id: "drawdown" as const, label: "Drawdown" },
];

const BOTTOM_TABS = [
  { id: "trading" as const, label: "Trading" },
  { id: "symbols" as const, label: "Simbol" },
  { id: "yearly" as const, label: "Tahunan" },
  { id: "daily" as const, label: "Hari" },
  { id: "hourly" as const, label: "Jam" },
];

type Props = {
  model: PortfolioStatsModel;
  /** Tampilan pembaca komunitas: judul nama akun, tanpa nomor login & tanpa trade log pemilik. */
  communityPresentation?: {
    accountTitle: string;
    ownerName: string | null;
    ownerSlug: string | null;
  };
  /** Posisi terbuka & order tertunda (snapshot terakhir dari EA v1.05+). */
  activity?: TradingActivityView | null;
};

export function PortfolioAccountStatsBoard({ model, communityPresentation, activity }: Props) {
  const cp = communityPresentation;
  const isCommunity = cp != null;

  const [chartTab, setChartTab] = useState<(typeof CHART_TABS)[number]["id"]>("growth");
  const [bottomTab, setBottomTab] = useState<(typeof BOTTOM_TABS)[number]["id"]>("trading");
  const [activityTab, setActivityTab] = useState<"open" | "pending">("open");

  const chartData = useMemo(() => {
    switch (chartTab) {
      case "growth":
        return model.chart.growth.map((p) => ({ name: p.date, v: p.value }));
      case "balance":
        return model.chart.balance.map((p) => ({ name: p.date, b: p.balance, e: p.equity }));
      case "profit":
        return model.chart.profitDay.map((p) => ({ name: p.date, v: p.value }));
      case "drawdown":
        return model.chart.drawdownPct.map((p) => ({ name: p.date, v: p.value }));
      default:
        return [];
    }
  }, [chartTab, model.chart]);

  const pfLabel =
    model.summary.profitFactor == null
      ? model.summary.closedTrades === 0
        ? "—"
        : "∞"
      : model.summary.profitFactor.toLocaleString("id-ID", { maximumFractionDigits: 2 });

  const activityRef = activity ? new Date(activity.recordedAt) : null;
  const openTotals = useMemo(() => {
    if (!activity) return null;
    let profit = 0;
    let swap = 0;
    let points = 0;
    for (const p of activity.positions) {
      profit += p.profit;
      swap += p.swap;
      if (p.points != null && Number.isFinite(p.points)) points += p.points;
    }
    return { profit, swap, points };
  }, [activity]);

  const curSfx = model.accountCurrency ? ` ${model.accountCurrency}` : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-accent">
            {isCommunity ? "Ringkasan publik" : "Akun MT"}
          </p>
          <h2
            className={clsx(
              "mt-1 text-xl font-bold text-white sm:text-2xl",
              isCommunity || Boolean(model.tradeAccountName?.trim())
                ? "font-semibold tracking-tight"
                : "font-mono"
            )}
          >
            {isCommunity
              ? cp.accountTitle
              : model.tradeAccountName?.trim() || model.mtLogin}
          </h2>
          {isCommunity ? (
            <p className="mt-1 text-xs text-broker-muted">
              Pemilik:{" "}
              {cp.ownerSlug ? (
                <Link href={`/${cp.ownerSlug}`} className="font-medium text-broker-accent hover:underline">
                  @{cp.ownerSlug}
                </Link>
              ) : (
                <span className="text-white/90">{cp.ownerName ?? "—"}</span>
              )}
            </p>
          ) : model.tradeAccountName?.trim() ? (
            <p className="mt-1 font-mono text-[11px] text-broker-muted sm:text-xs">
              Login MT <span className="text-white/85">{model.mtLogin}</span>
            </p>
          ) : null}
          <PortfolioAccountBrokerLine
            brokerName={model.brokerName}
            brokerServer={model.brokerServer}
            explainIfMissing
            className="mt-1"
          />
          <p className="mt-1 text-xs text-broker-muted">
            {model.accountCurrency ? (
              <>
                Mata uang akun MT (nominal profit/saldo):{" "}
                <span className="font-semibold text-white">{model.accountCurrency}</span>
                <span className="text-broker-border"> · </span>
              </>
            ) : null}
            {model.sidebar.noteTz}
          </p>
        </div>
        {isCommunity ? (
          <Link
            href="/profil/portfolio/community/accounts"
            className="inline-flex w-fit items-center rounded-lg border border-broker-border/80 bg-broker-bg/40 px-3 py-2 text-xs font-medium text-broker-accent hover:bg-broker-surface/60"
          >
            ← Akun komunitas
          </Link>
        ) : (
          <Link
            href={`/profil/portfolio/trade-log?mtLogin=${encodeURIComponent(model.mtLogin)}`}
            className="inline-flex w-fit items-center rounded-lg border border-broker-border/80 bg-broker-bg/40 px-3 py-2 text-xs font-medium text-broker-accent hover:bg-broker-surface/60"
          >
            Lihat trade log →
          </Link>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Saldo (snapshot)"
          value={model.summary.balance == null ? "—" : fmtNum(model.summary.balance)}
          sub={model.summary.equity != null ? `Equity: ${fmtNum(model.summary.equity)}` : undefined}
        />
        <StatCard
          label="Net P/L (trading)"
          value={fmtNum(model.summary.netPl)}
          valueClass={signedClass(model.summary.netPl)}
          sub={`${model.summary.closedTrades} penutupan`}
        />
        <StatCard
          label="Win rate"
          value={model.summary.winRatePct == null ? "—" : fmtPct(model.summary.winRatePct, 1)}
          sub="Hanya deal penutupan"
        />
        <StatCard label="Profit factor" value={pfLabel} sub="Laba kotor / rugi kotor" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1 border-b border-broker-border/50 pb-2">
            {CHART_TABS.map((t) => (
              <TabBtn key={t.id} active={chartTab === t.id} onClick={() => setChartTab(t.id)}>
                {t.label}
              </TabBtn>
            ))}
          </div>

          <div className="h-[280px] w-full rounded-xl border border-broker-border/80 bg-broker-bg/30 p-2 sm:h-[320px] sm:p-3">
            {chartTab === "balance" && model.chart.balance.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-broker-muted">
                Belum ada seri snapshot saldo. EA mengirim snapshot bersama deal — setelah beberapa sinkron, grafik
                terisi.
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-broker-muted">
                Belum cukup data untuk grafik.
              </div>
            ) : chartTab === "balance" ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2329" />
                  <XAxis dataKey="name" tick={{ fill: "#848e9c", fontSize: 10 }} stroke="#1e2329" />
                  <YAxis tick={{ fill: "#848e9c", fontSize: 10 }} stroke="#1e2329" width={56} />
                  <Tooltip
                    contentStyle={{
                      background: "#12161c",
                      border: "1px solid #1e2329",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#848e9c" }}
                  />
                  <Line type="monotone" dataKey="b" name="Saldo" stroke="#00d395" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="e" name="Equity" stroke="#f0b90b" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : chartTab === "drawdown" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2329" />
                  <XAxis dataKey="name" tick={{ fill: "#848e9c", fontSize: 10 }} stroke="#1e2329" />
                  <YAxis tick={{ fill: "#848e9c", fontSize: 10 }} stroke="#1e2329" width={44} />
                  <Tooltip
                    contentStyle={{
                      background: "#12161c",
                      border: "1px solid #1e2329",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${fmtNum(v, 2)}%`, "Drawdown"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    name="Drawdown %"
                    stroke="#f6465d"
                    fill="#f6465d"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2329" />
                  <XAxis dataKey="name" tick={{ fill: "#848e9c", fontSize: 10 }} stroke="#1e2329" />
                  <YAxis tick={{ fill: "#848e9c", fontSize: 10 }} stroke="#1e2329" width={56} />
                  <Tooltip
                    contentStyle={{
                      background: "#12161c",
                      border: "1px solid #1e2329",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    name={chartTab === "growth" ? "Kumulatif" : "Profit"}
                    stroke="#00d395"
                    fill="#00d395"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-broker-border/80 bg-broker-surface/40">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-broker-border/80 bg-broker-bg/50 text-[10px] uppercase tracking-wide text-broker-muted">
                  <th className="px-3 py-2 font-medium">Periode</th>
                  <th className="px-3 py-2 font-medium">Gain %</th>
                  <th className="px-3 py-2 font-medium">Profit</th>
                  <th className="px-3 py-2 font-medium">Win rate</th>
                  <th className="px-3 py-2 font-medium">Trade</th>
                  <th className="px-3 py-2 font-medium">Lot</th>
                </tr>
              </thead>
              <tbody>
                {model.periodRows.map((r) => (
                  <tr key={r.key} className="border-b border-broker-border/30 text-broker-muted">
                    <td className="px-3 py-2 font-medium text-white">{r.label}</td>
                    <td className={clsx("px-3 py-2 font-mono", signedClass(r.gainPct ?? 0))}>
                      {fmtPct(r.gainPct)}
                    </td>
                    <td className={clsx("px-3 py-2 font-mono", signedClass(r.profit))}>{fmtNum(r.profit)}</td>
                    <td className="px-3 py-2 font-mono">{fmtPct(r.winRatePct, 1)}</td>
                    <td className="px-3 py-2 font-mono text-white">{r.trades}</td>
                    <td className="px-3 py-2 font-mono">{fmtNum(r.lots, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-broker-border/50 px-3 py-2 text-[10px] text-broker-muted/70">
              Gain % membutuhkan minimal dua snapshot saldo yang mengapit periode; jika kosong, EA belum mengirim
              cukup data.
            </p>
          </div>
        </div>

        <aside className="rounded-xl border border-broker-border/80 bg-broker-surface/40 p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-broker-muted">Ringkas akun</p>
          <div className="mt-2">
            <SidebarRow k="Risk score" v={model.sidebar.riskScore} />
            <SidebarRow k="Abs. gain" v={fmtPct(model.sidebar.absGainPct)} vClass={signedClass(model.sidebar.absGainPct ?? 0)} />
            <SidebarRow k="Harian (est.)" v={fmtPct(model.sidebar.dailyPct)} vClass={signedClass(model.sidebar.dailyPct ?? 0)} />
            <SidebarRow k="Mingguan" v={fmtPct(model.sidebar.weeklyPct)} vClass={signedClass(model.sidebar.weeklyPct ?? 0)} />
            <SidebarRow k="Bulanan" v={fmtPct(model.sidebar.monthlyPct)} vClass={signedClass(model.sidebar.monthlyPct ?? 0)} />
            <SidebarRow k="Drawdown saldo (titik)" v={fmtPct(model.sidebar.balanceDdPct)} />
            <SidebarRow k="Drawdown equity (titik)" v={fmtPct(model.sidebar.equityDdPct)} />
            <SidebarRow k="Max DD saldo" v={fmtPct(model.sidebar.maxBalDdPct)} />
            <SidebarRow k="Max DD equity" v={fmtPct(model.sidebar.maxEqDdPct)} />
            <SidebarRow
              k="Profit trading"
              v={fmtNum(model.sidebar.profit)}
              vClass={signedClass(model.sidebar.profit)}
            />
            <SidebarRow k="Komisi (total)" v={fmtNum(model.sidebar.commission)} />
            <SidebarRow k="Swap" v={fmtNum(model.sidebar.swap)} />
            <SidebarRow k="Deposit (balance)" v={fmtNum(model.sidebar.deposits)} />
            <SidebarRow k="Withdrawal (balance)" v={fmtNum(model.sidebar.withdrawals)} />
            <SidebarRow
              k="Update terakhir"
              v={
                model.sidebar.lastUpdate
                  ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(model.sidebar.lastUpdate)
                    )
                  : "—"
              }
            />
          </div>
        </aside>
      </div>

      <div className="rounded-xl border border-broker-border/80 bg-broker-surface/40 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1 border-b border-broker-border/50 pb-3">
          {BOTTOM_TABS.map((t) => (
            <TabBtn key={t.id} active={bottomTab === t.id} onClick={() => setBottomTab(t.id)}>
              {t.label}
            </TabBtn>
          ))}
        </div>

        <div className="mt-4">
          {bottomTab === "trading" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1 text-xs">
                <p className="mb-2 font-semibold uppercase tracking-wide text-broker-muted">Volume</p>
                <SidebarRow k="Total trade" v={String(model.trading.totalTrades)} />
                <SidebarRow k="Total lot" v={fmtNum(model.trading.totalLots, 4)} />
                <SidebarRow k="Pips" v="—" />
                <SidebarRow k="Komisi" v={fmtNum(model.trading.commission)} />
                <SidebarRow k="Swap" v={fmtNum(model.trading.swap)} />
                <SidebarRow k="Aktivitas" v={model.trading.activity} />
              </div>
              <div className="space-y-1 text-xs">
                <p className="mb-2 font-semibold uppercase tracking-wide text-broker-muted">Durasi / arah</p>
                <SidebarRow k="Win rate" v={fmtPct(model.trading.winRatePct, 1)} />
                <SidebarRow k="Trade terpanjang" v={model.trading.longestTrade} />
                <SidebarRow k="Trade terpendek" v={model.trading.shortestTrade} />
                <SidebarRow k="Rata trade" v={model.trading.avgTrade} />
                <SidebarRow k="Long menang" v={model.trading.longsWon} />
                <SidebarRow k="Short menang" v={model.trading.shortsWon} />
              </div>
              <div className="space-y-1 text-xs">
                <p className="mb-2 font-semibold uppercase tracking-wide text-broker-muted">Ekspektasi</p>
                <SidebarRow
                  k="Expectancy"
                  v={model.trading.expectancy == null ? "—" : fmtNum(model.trading.expectancy)}
                />
                <SidebarRow k="Profit factor" v={pfLabel} />
                <SidebarRow k="Avg win" v={model.trading.avgWin == null ? "—" : fmtNum(model.trading.avgWin)} />
                <SidebarRow k="Avg loss" v={model.trading.avgLoss == null ? "—" : fmtNum(model.trading.avgLoss)} />
                <SidebarRow
                  k="Trade terbaik"
                  v={model.trading.bestTrade == null ? "—" : fmtNum(model.trading.bestTrade)}
                  vClass={model.trading.bestTrade != null ? signedClass(model.trading.bestTrade) : undefined}
                />
                <SidebarRow
                  k="Trade terburuk"
                  v={model.trading.worstTrade == null ? "—" : fmtNum(model.trading.worstTrade)}
                  vClass={model.trading.worstTrade != null ? signedClass(model.trading.worstTrade) : undefined}
                />
              </div>
            </div>
          )}

          {bottomTab === "symbols" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-broker-border/80 text-[10px] uppercase tracking-wide text-broker-muted">
                    <th className="py-2 pr-3 font-medium">Simbol</th>
                    <th className="py-2 pr-3 font-medium">Trade</th>
                    <th className="py-2 pr-3 font-medium">Lot</th>
                    <th className="py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {model.symbols.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-broker-muted">
                        Belum ada deal penutupan.
                      </td>
                    </tr>
                  ) : (
                    model.symbols.map((s) => (
                      <tr key={s.symbol} className="border-b border-broker-border/30">
                        <td className="py-2 pr-3 font-medium text-broker-accent">{s.symbol}</td>
                        <td className="py-2 pr-3 font-mono text-broker-muted">{s.trades}</td>
                        <td className="py-2 pr-3 font-mono text-broker-muted">{fmtNum(s.lots, 4)}</td>
                        <td className={clsx("py-2 font-mono", signedClass(s.net))}>{fmtNum(s.net)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {bottomTab === "yearly" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-broker-border/80 text-[10px] uppercase tracking-wide text-broker-muted">
                    <th className="py-2 pr-3 font-medium">Tahun</th>
                    <th className="py-2 pr-3 font-medium">Trade</th>
                    <th className="py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {model.yearly.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-broker-muted">
                        Belum ada data.
                      </td>
                    </tr>
                  ) : (
                    model.yearly.map((y) => (
                      <tr key={y.year} className="border-b border-broker-border/30">
                        <td className="py-2 pr-3 font-mono text-white">{y.year}</td>
                        <td className="py-2 pr-3 font-mono text-broker-muted">{y.trades}</td>
                        <td className={clsx("py-2 font-mono", signedClass(y.net))}>{fmtNum(y.net)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {bottomTab === "daily" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-broker-border/80 text-[10px] uppercase tracking-wide text-broker-muted">
                    <th className="py-2 pr-3 font-medium">Hari (UTC)</th>
                    <th className="py-2 pr-3 font-medium">Trade</th>
                    <th className="py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {model.dailyAnalysis.map((d) => (
                    <tr key={d.label} className="border-b border-broker-border/30">
                      <td className="py-2 pr-3 text-white">{d.label}</td>
                      <td className="py-2 pr-3 font-mono text-broker-muted">{d.trades}</td>
                      <td className={clsx("py-2 font-mono", signedClass(d.net))}>{fmtNum(d.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bottomTab === "hourly" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-broker-border/80 text-[10px] uppercase tracking-wide text-broker-muted">
                    <th className="py-2 pr-3 font-medium">Jam</th>
                    <th className="py-2 pr-3 font-medium">Trade</th>
                    <th className="py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {model.hourlyAnalysis.map((h) => (
                    <tr key={h.hour} className="border-b border-broker-border/30">
                      <td className="py-2 pr-3 font-mono text-white">{h.label}</td>
                      <td className="py-2 pr-3 font-mono text-broker-muted">{h.trades}</td>
                      <td className={clsx("py-2 font-mono", signedClass(h.net))}>{fmtNum(h.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-broker-border/80 bg-broker-surface/40 p-3 sm:p-4">
        <div className="flex flex-col gap-2 border-b border-broker-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Aktivitas</h3>
          {activity && activityRef ? (
            <p className="text-[10px] text-broker-muted sm:text-xs">
              Terakhir dari EA:{" "}
              <span className="font-mono text-white/85">
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(activityRef)}
              </span>
            </p>
          ) : null}
        </div>

        {!activity ? (
          <p className="py-4 text-sm leading-relaxed text-broker-muted">
            Tabel posisi terbuka dan order tertunda akan tampil di sini setelah{" "}
            <strong className="text-white/90">EA GMRFX v1.05+</strong> mengirim data ke server (jalankan{" "}
            <code className="rounded bg-broker-bg/80 px-1 font-mono text-[11px] text-broker-accent">
              npx prisma migrate deploy
            </code>{" "}
            lalu compile ulang EA). Durasi &amp; P/L mengacu pada waktu sinkron terakhir, bukan live tick.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-1">
              <TabBtn active={activityTab === "open"} onClick={() => setActivityTab("open")}>
                Posisi terbuka
              </TabBtn>
              <TabBtn active={activityTab === "pending"} onClick={() => setActivityTab("pending")}>
                Order tertunda
              </TabBtn>
            </div>

            {activityTab === "open" && activityRef && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left text-[11px] sm:text-xs">
                  <thead>
                    <tr className="border-b border-broker-border/80 text-[10px] uppercase tracking-wide text-broker-muted">
                      <th className="py-2 pr-2 font-medium">Buka</th>
                      <th className="py-2 pr-2 font-medium">Durasi</th>
                      <th className="py-2 pr-2 font-medium">Simbol</th>
                      <th className="py-2 pr-2 font-medium">Tipe</th>
                      <th className="py-2 pr-2 font-medium">Lot</th>
                      <th className="py-2 pr-2 font-medium">Harga buka</th>
                      <th className="py-2 pr-2 font-medium">S/L</th>
                      <th className="py-2 pr-2 font-medium">T/P</th>
                      <th className="py-2 pr-2 font-medium">Net P/L</th>
                      <th className="py-2 pr-2 font-medium">Poin</th>
                      <th className="py-2 font-medium">Swap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.positions.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-broker-muted">
                          Tidak ada posisi terbuka pada snapshot terakhir.
                        </td>
                      </tr>
                    ) : (
                      activity.positions.map((p) => (
                        <tr key={p.ticket} className="border-b border-broker-border/30">
                          <td className="py-2 pr-2 font-mono text-white/90">
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(p.openTime * 1000))}
                          </td>
                          <td className="py-2 pr-2 text-broker-muted">
                            {formatDurationFromOpen(p.openTime, activityRef)}
                          </td>
                          <td className="py-2 pr-2 font-medium text-broker-accent">{p.symbol}</td>
                          <td className="py-2 pr-2 text-white/90">{sideLabel(p.side)}</td>
                          <td className="py-2 pr-2 font-mono">{fmtNum(p.volume, 4)}</td>
                          <td className="py-2 pr-2 font-mono">{fmtLevel(p.priceOpen)}</td>
                          <td className="py-2 pr-2 font-mono text-broker-muted">{fmtLevel(p.sl ?? null)}</td>
                          <td className="py-2 pr-2 font-mono text-broker-muted">{fmtLevel(p.tp ?? null)}</td>
                          <td className={clsx("py-2 pr-2 font-mono", signedClass(p.profit))}>
                            {fmtNum(p.profit)}
                            {curSfx}
                          </td>
                          <td className="py-2 pr-2 font-mono text-broker-muted">
                            {p.points == null || !Number.isFinite(p.points) ? "—" : fmtNum(p.points, 1)}
                          </td>
                          <td className={clsx("py-2 font-mono", signedClass(p.swap))}>{fmtNum(p.swap)}</td>
                        </tr>
                      ))
                    )}
                    {activity.positions.length > 0 && openTotals ? (
                      <tr className="border-t border-broker-border/80 bg-broker-bg/40 font-semibold">
                        <td colSpan={8} className="py-2 pr-2 text-right text-broker-muted">
                          Total
                        </td>
                        <td className={clsx("py-2 pr-2 font-mono", signedClass(openTotals.profit))}>
                          {fmtNum(openTotals.profit)}
                          {curSfx}
                        </td>
                        <td className="py-2 pr-2 font-mono text-broker-muted">
                          {fmtNum(openTotals.points, 1)}
                        </td>
                        <td className={clsx("py-2 font-mono", signedClass(openTotals.swap))}>{fmtNum(openTotals.swap)}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            {activityTab === "pending" && activityRef && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[11px] sm:text-xs">
                  <thead>
                    <tr className="border-b border-broker-border/80 text-[10px] uppercase tracking-wide text-broker-muted">
                      <th className="py-2 pr-2 font-medium">Waktu</th>
                      <th className="py-2 pr-2 font-medium">Simbol</th>
                      <th className="py-2 pr-2 font-medium">Tipe</th>
                      <th className="py-2 pr-2 font-medium">Lot</th>
                      <th className="py-2 pr-2 font-medium">Harga</th>
                      <th className="py-2 pr-2 font-medium">S/L</th>
                      <th className="py-2 font-medium">T/P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.pendingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-broker-muted">
                          Tidak ada order tertunda pada snapshot terakhir.
                        </td>
                      </tr>
                    ) : (
                      activity.pendingOrders.map((o) => (
                        <tr key={o.ticket} className="border-b border-broker-border/30">
                          <td className="py-2 pr-2 font-mono text-white/90">
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(o.setupTime * 1000))}
                          </td>
                          <td className="py-2 pr-2 font-medium text-broker-accent">{o.symbol}</td>
                          <td className="py-2 pr-2 text-white/90">{mtPendingOrderTypeLabel(o.orderType)}</td>
                          <td className="py-2 pr-2 font-mono">{fmtNum(o.volume, 4)}</td>
                          <td className="py-2 pr-2 font-mono">{fmtLevel(o.priceOrder)}</td>
                          <td className="py-2 pr-2 font-mono text-broker-muted">{fmtLevel(o.sl ?? null)}</td>
                          <td className="py-2 font-mono text-broker-muted">{fmtLevel(o.tp ?? null)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
