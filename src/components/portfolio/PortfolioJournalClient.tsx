"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  clampDay,
  dayKeyFromYMD,
  daysInMonth,
  formatJournalDateDMY,
  jakartaWeekdayMon0FromYMD,
  nextMonth,
  prevMonth,
  JOURNAL_TIMEZONE,
} from "@/lib/mt5Journal";

export type JournalDealRow = {
  id: string;
  ticket: string;
  dayKey: string;
  dealTimeIso: string;
  symbol: string;
  dealType: number;
  volume: number;
  swap: number;
  commission: number;
  profit: number;
  net: number;
  magic: number;
  comment: string;
};

function fmtNum(n: number, maxFrac = 5): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("id-ID", { maximumFractionDigits: maxFrac });
}

function signedClass(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-broker-danger";
  return "text-broker-muted";
}

function journalHref(mtLogin: string, y: number, m: number, d: number): string {
  const cd = clampDay(y, m, d);
  const q = new URLSearchParams({
    mtLogin,
    y: String(y),
    m: String(m),
    d: String(cd),
  });
  return `/profil/portfolio/journal?${q.toString()}`;
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

type Props = {
  mtLogin: string;
  year: number;
  month: number;
  day: number;
  deals: JournalDealRow[];
};

export function PortfolioJournalClient({ mtLogin, year, month, day, deals }: Props) {
  const [filter, setFilter] = useState("");

  const selectedKey = dayKeyFromYMD(year, month, day);

  const dayNetMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of deals) {
      m.set(row.dayKey, (m.get(row.dayKey) ?? 0) + row.net);
    }
    return m;
  }, [deals]);

  const dayRows = useMemo(() => {
    return deals
      .filter((r) => r.dayKey === selectedKey)
      .sort((a, b) => new Date(b.dealTimeIso).getTime() - new Date(a.dealTimeIso).getTime());
  }, [deals, selectedKey]);

  const selectedRows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return dayRows;
    return dayRows.filter((r) => {
      const typeStr = r.dealType === 0 ? "buy" : r.dealType === 1 ? "sell" : String(r.dealType);
      const hay = [
        r.symbol,
        typeStr,
        String(r.volume),
        String(r.magic),
        r.comment,
        r.ticket,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(f);
    });
  }, [dayRows, filter]);

  const dayStats = useMemo(() => {
    const nets = dayRows.map((r) => r.net);
    const netPnl = nets.reduce((a, b) => a + b, 0);
    let longs = 0;
    let shorts = 0;
    let wins = 0;
    let losses = 0;
    for (const r of dayRows) {
      if (r.dealType === 0) longs++;
      if (r.dealType === 1) shorts++;
      if (r.net > 0) wins++;
      else if (r.net < 0) losses++;
    }
    const wrDenom = wins + losses;
    const winRate = wrDenom > 0 ? (100 * wins) / wrDenom : null;
    return {
      netPnl,
      longs,
      shorts,
      wins,
      losses,
      trades: dayRows.length,
      winRate,
    };
  }, [dayRows]);

  const totals = useMemo(() => {
    return selectedRows.reduce(
      (acc, r) => {
        acc.lots += r.volume;
        acc.swap += r.swap;
        acc.commission += r.commission;
        acc.net += r.net;
        return acc;
      },
      { lots: 0, swap: 0, commission: 0, net: 0 }
    );
  }, [selectedRows]);

  const dim = daysInMonth(year, month);
  const lead = jakartaWeekdayMon0FromYMD(year, month, 1);
  const cells = lead + dim;
  const rows = Math.ceil(cells / 7);

  const { y: py, m: pm } = prevMonth(year, month);
  const { y: ny, m: nm } = nextMonth(year, month);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr] xl:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-3 shadow-md sm:p-4">
        <div className="flex items-center justify-between gap-2 border-b border-broker-border/50 pb-3">
          <Link
            href={journalHref(mtLogin, py, pm, clampDay(py, pm, day))}
            className="rounded-lg border border-broker-border/70 px-2 py-1 text-sm text-broker-accent hover:bg-broker-bg/50"
            aria-label="Bulan sebelumnya"
          >
            ‹
          </Link>
          <p className="text-center text-sm font-semibold text-white">
            {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: JOURNAL_TIMEZONE }).format(
              new Date(`${year}-${String(month).padStart(2, "0")}-15T12:00:00+07:00`)
            )}
          </p>
          <Link
            href={journalHref(mtLogin, ny, nm, clampDay(ny, nm, day))}
            className="rounded-lg border border-broker-border/70 px-2 py-1 text-sm text-broker-accent hover:bg-broker-bg/50"
            aria-label="Bulan berikutnya"
          >
            ›
          </Link>
        </div>
        <p className="mt-2 text-[10px] text-broker-muted/80">Hari mengikuti zona {JOURNAL_TIMEZONE}.</p>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-broker-muted">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: rows * 7 }, (_, i) => {
            const dom = i - lead + 1;
            if (dom < 1 || dom > dim) {
              return <div key={`e-${i}`} className="aspect-square rounded-lg bg-transparent" />;
            }
            const dk = dayKeyFromYMD(year, month, dom);
            const net = dayNetMap.get(dk) ?? 0;
            const has = deals.some((r) => r.dayKey === dk);
            const selected = dk === selectedKey;
            const bg =
              !has || net === 0
                ? "bg-broker-bg/40"
                : net > 0
                  ? "bg-emerald-500/20"
                  : "bg-broker-danger/15";

            return (
              <Link
                key={dk}
                href={journalHref(mtLogin, year, month, dom)}
                className={clsx(
                  "flex aspect-square items-center justify-center rounded-lg text-sm font-mono transition",
                  bg,
                  selected
                    ? "ring-2 ring-white/90 ring-offset-2 ring-offset-broker-surface"
                    : "hover:ring-1 hover:ring-broker-accent/40",
                  "text-white"
                )}
              >
                {dom}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-muted">Hari terpilih</p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">{formatJournalDateDMY(selectedKey)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-broker-border/70 bg-broker-bg/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-broker-muted">Net P/L</p>
            <p className={clsx("mt-1 font-mono text-lg font-semibold", signedClass(dayStats.netPnl))}>
              {fmtNum(dayStats.netPnl, 2)}
            </p>
          </div>
          <div className="rounded-xl border border-broker-border/70 bg-broker-bg/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-broker-muted">Long</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">{dayStats.longs}</p>
          </div>
          <div className="rounded-xl border border-broker-border/70 bg-broker-bg/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-broker-muted">Short</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">{dayStats.shorts}</p>
          </div>
          <div className="rounded-xl border border-broker-border/70 bg-broker-bg/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-broker-muted">Menang / Kalah</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">
              {dayStats.wins} / {dayStats.losses}
            </p>
          </div>
          <div className="rounded-xl border border-broker-border/70 bg-broker-bg/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-broker-muted">Trade</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">{dayStats.trades}</p>
          </div>
          <div className="rounded-xl border border-broker-border/70 bg-broker-bg/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-broker-muted">Win rate</p>
            <p className="mt-1 font-mono text-lg font-semibold text-white">
              {dayStats.winRate == null ? "—" : `${dayStats.winRate.toFixed(2)}%`}
            </p>
          </div>
        </div>

        <div>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter: simbol, tipe, lot, magic, komentar, ticket…"
            className="w-full rounded-xl border border-broker-border/80 bg-broker-bg/40 px-3 py-2.5 text-sm text-white placeholder:text-broker-muted/60 focus:border-broker-accent/50 focus:outline-none focus:ring-1 focus:ring-broker-accent/30"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-broker-border/80 bg-broker-surface/40">
          <table className="w-full min-w-[920px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-broker-border/80 bg-broker-bg/50 text-[10px] uppercase tracking-wide text-broker-muted">
                <th className="px-2 py-2 font-medium">Simbol</th>
                <th className="px-2 py-2 font-medium">Tipe</th>
                <th className="px-2 py-2 font-medium">Waktu tutup</th>
                <th className="px-2 py-2 text-right font-medium">Lot</th>
                <th className="px-2 py-2 text-right font-medium">Swap</th>
                <th className="px-2 py-2 text-right font-medium">Komisi</th>
                <th className="px-2 py-2 text-right font-medium">Net P/L</th>
                <th className="px-2 py-2 font-medium">Durasi</th>
                <th className="px-2 py-2 font-medium">Magic</th>
                <th className="min-w-[5rem] px-2 py-2 font-medium">Komentar</th>
                <th className="px-2 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {selectedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-broker-muted">
                    Tidak ada deal penutupan pada tanggal ini (atau tidak cocok filter).
                  </td>
                </tr>
              ) : (
                selectedRows.map((r) => {
                  const isBuy = r.dealType === 0;
                  const closeStr = new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "short",
                    timeStyle: "medium",
                    timeZone: JOURNAL_TIMEZONE,
                  }).format(new Date(r.dealTimeIso));
                  return (
                    <tr key={r.id} className="border-b border-broker-border/30 text-broker-muted">
                      <td className="px-2 py-2 font-medium text-broker-accent">{r.symbol}</td>
                      <td className="px-2 py-2">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 font-semibold",
                            isBuy ? "text-sky-400" : "text-broker-danger"
                          )}
                        >
                          {isBuy ? "↑" : "↓"} {isBuy ? "BUY" : "SELL"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-white">{closeStr}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(r.volume, 4)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(r.swap)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(r.commission)}</td>
                      <td className={clsx("px-2 py-2 text-right font-mono font-medium", signedClass(r.net))}>
                        {fmtNum(r.net, 2)}
                      </td>
                      <td className="px-2 py-2 text-broker-muted/80" title="Perlu position ID dari MT5">
                        —
                      </td>
                      <td className="px-2 py-2 font-mono text-white">{r.magic || "—"}</td>
                      <td className="max-w-[8rem] truncate px-2 py-2" title={r.comment || undefined}>
                        {r.comment || "—"}
                      </td>
                      <td className="px-2 py-2">
                        <Link
                          href={`/profil/portfolio/trade-log?mtLogin=${encodeURIComponent(mtLogin)}&ticket=${encodeURIComponent(r.ticket)}`}
                          className="rounded-md border border-broker-border/70 px-2 py-1 text-[10px] font-medium text-broker-accent hover:bg-broker-bg/50"
                        >
                          Log
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {selectedRows.length > 0 ? (
              <tfoot>
                <tr className="border-t border-broker-border/80 bg-broker-bg/40 font-semibold text-white">
                  <td colSpan={3} className="px-2 py-2">
                    Total
                  </td>
                  <td className="px-2 py-2 text-right font-mono">{fmtNum(totals.lots, 4)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtNum(totals.swap)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtNum(totals.commission)}</td>
                  <td className={clsx("px-2 py-2 text-right font-mono", signedClass(totals.net))}>
                    {fmtNum(totals.net, 2)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}
