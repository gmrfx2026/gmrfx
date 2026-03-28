import Link from "next/link";
import { headers } from "next/headers";
import clsx from "clsx";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Mt5TokenPanel } from "@/components/portfolio/Mt5TokenPanel";
import { PortfolioSummaryCards } from "@/components/portfolio/PortfolioSummaryCards";
import { SummaryDateRangeForm } from "@/components/portfolio/SummaryDateRangeForm";
import {
  jakartaRangeUtcBounds,
  presetThisMonth,
  presetLastMonth,
  presetLast30Days,
  presetThisYear,
  computeRangeSummary,
  formatSummaryRangeLabel,
} from "@/lib/mt5SummaryRange";

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

async function linkedLogins(userId: string): Promise<string[]> {
  const [fromDeals, fromSnaps] = await Promise.all([
    prisma.mtDeal.groupBy({ by: ["mtLogin"], where: { userId } }),
    prisma.mtAccountSnapshot.groupBy({ by: ["mtLogin"], where: { userId } }),
  ]);
  const set = new Set<string>();
  for (const r of fromDeals) set.add(r.mtLogin);
  for (const r of fromSnaps) set.add(r.mtLogin);
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function summaryHref(mtLogin: string, from: string, to: string): string {
  const q = new URLSearchParams({ mtLogin, from, to });
  return `/profil/portfolio/summary?${q.toString()}`;
}

export default async function PortfolioSummaryPage({
  searchParams,
}: {
  searchParams: { mtLogin?: string; from?: string; to?: string };
}) {
  const origin = siteOrigin();
  const ingestPath = `${origin}/api/mt5/ingest`;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profil/portfolio/summary");
  }

  const userId = session.user.id;
  const logins = await linkedLogins(userId);

  const mtLoginRaw = typeof searchParams?.mtLogin === "string" ? searchParams.mtLogin.trim() : "";
  const defRange = presetThisMonth();
  let fromKey = typeof searchParams?.from === "string" ? searchParams.from.trim().slice(0, 10) : "";
  let toKey = typeof searchParams?.to === "string" ? searchParams.to.trim().slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromKey)) fromKey = defRange.from;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(toKey)) toKey = defRange.to;

  let range = jakartaRangeUtcBounds(fromKey, toKey);
  if (!range) {
    fromKey = defRange.from;
    toKey = defRange.to;
    range = jakartaRangeUtcBounds(fromKey, toKey)!;
  }

  const presets = [
    { label: "Bulan ini", ...presetThisMonth() },
    { label: "Bulan lalu", ...presetLastMonth() },
    { label: "30 hari", ...presetLast30Days() },
    { label: "Tahun ini", ...presetThisYear() },
  ];

  if (logins.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Ringkasan akun</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Token MT5 dan ringkasan angka setelah EA mengirim data.
          </p>
        </header>
        <Mt5TokenPanel ingestPath={ingestPath} />
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-sm text-amber-100/90">
          Belum ada akun MT di database. Pasang EA dengan token di bawah, lalu refresh halaman ini.
        </div>
      </div>
    );
  }

  let mtLogin = mtLoginRaw;
  if (!mtLogin && logins.length === 1) {
    redirect(summaryHref(logins[0]!, fromKey, toKey));
  }

  if (!mtLogin) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Ringkasan akun</h1>
          <p className="mt-1 text-sm text-broker-muted">Pilih akun MT untuk melihat ringkasan periode.</p>
        </header>
        <Mt5TokenPanel ingestPath={ingestPath} />
        <div className="grid gap-3 sm:grid-cols-2">
          {logins.map((login) => (
            <Link
              key={login}
              href={summaryHref(login, fromKey, toKey)}
              className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-muted">Login MT</p>
              <p className="mt-2 font-mono text-lg font-semibold text-broker-accent">{login}</p>
              <p className="mt-2 text-xs text-broker-muted">Buka ringkasan →</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!logins.includes(mtLogin)) {
    redirect("/profil/portfolio/summary");
  }

  const { start, end } = range;

  const [rawDeals, lastSnap, lastDeal] = await Promise.all([
    prisma.mtDeal.findMany({
      where: {
        userId,
        mtLogin,
        dealTime: { gte: start, lte: end },
        dealType: { in: [0, 1] },
        entryType: { in: [1, 3] },
      },
      select: {
        dealType: true,
        entryType: true,
        profit: true,
        commission: true,
        swap: true,
      },
    }),
    prisma.mtAccountSnapshot.findFirst({
      where: { userId, mtLogin, recordedAt: { lte: end } },
      orderBy: { recordedAt: "desc" },
      select: { balance: true, equity: true, recordedAt: true },
    }),
    prisma.mtDeal.findFirst({
      where: { userId, mtLogin, dealTime: { lte: end } },
      orderBy: { dealTime: "desc" },
      select: { dealTime: true },
    }),
  ]);

  const metrics = computeRangeSummary(rawDeals);
  const balance = lastSnap ? Number(lastSnap.balance) : null;
  const equity = lastSnap ? Number(lastSnap.equity) : null;

  const tSnap = lastSnap?.recordedAt?.getTime() ?? 0;
  const tDeal = lastDeal?.dealTime?.getTime() ?? 0;
  const lastTs = Math.max(tSnap, tDeal);
  const lastUpdatedStr =
    lastTs > 0
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(lastTs))
      : "—";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Ringkasan akun</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Metrik dari deal penutupan dalam rentang WIB. Grafik detail ada di{" "}
            <Link href={`/profil/portfolio/dashboard?mtLogin=${encodeURIComponent(mtLogin)}`} className="text-broker-accent hover:underline">
              Dashboard
            </Link>
            .
            {logins.length > 1 ? (
              <>
                {" "}
                <Link href="/profil/portfolio/summary" className="text-broker-accent hover:underline">
                  Ganti akun
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <p className="font-mono text-xs text-broker-muted">
          <span className="text-broker-accent">{mtLogin}</span>
          <span className="mx-2 text-broker-border">·</span>
          <span>Update: {lastUpdatedStr}</span>
        </p>
      </header>

      <Mt5TokenPanel ingestPath={ingestPath} />

      <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const active = p.from === fromKey && p.to === toKey;
              return (
                <Link
                  key={p.label}
                  href={summaryHref(mtLogin, p.from, p.to)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "bg-broker-accent/20 text-broker-accent ring-1 ring-broker-accent/40"
                      : "border border-broker-border/70 text-broker-muted hover:border-broker-accent/30 hover:text-white"
                  )}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
          <SummaryDateRangeForm mtLogin={mtLogin} from={fromKey} to={toKey} />
        </div>
      </div>

      <PortfolioSummaryCards
        rangeLabel={formatSummaryRangeLabel(fromKey, toKey)}
        metrics={metrics}
        balance={balance}
        equity={equity}
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/profil/portfolio/dashboard?mtLogin=${encodeURIComponent(mtLogin)}`}
          className="rounded-xl border border-broker-border/80 px-4 py-2 text-broker-accent hover:bg-broker-surface/50"
        >
          Dashboard →
        </Link>
        <Link
          href={`/profil/portfolio/journal?mtLogin=${encodeURIComponent(mtLogin)}`}
          className="rounded-xl border border-broker-border/80 px-4 py-2 text-broker-accent hover:bg-broker-surface/50"
        >
          Jurnal →
        </Link>
        <Link
          href={`/profil/portfolio/trade-log?mtLogin=${encodeURIComponent(mtLogin)}`}
          className="rounded-xl border border-broker-border/80 px-4 py-2 text-broker-accent hover:bg-broker-surface/50"
        >
          Trade log →
        </Link>
      </div>
    </div>
  );
}
