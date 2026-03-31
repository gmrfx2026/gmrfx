import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { dealNet, isClosingDeal } from "@/lib/mt5Stats";
import {
  clampDay,
  jakartaDayKey,
  jakartaMonthUtcRange,
  jakartaTodayParts,
} from "@/lib/mt5Journal";
import { PortfolioJournalClient, type JournalDealRow } from "@/components/portfolio/PortfolioJournalClient";
import { PortfolioAccountBrokerLine } from "@/components/portfolio/PortfolioAccountBrokerLine";

export const dynamic = "force-dynamic";

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

function num(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default async function PortfolioJournalPage({
  searchParams,
}: {
  searchParams: { mtLogin?: string; y?: string; m?: string; d?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil/portfolio/journal");

  const userId = session.user.id;
  const logins = await linkedLogins(userId);

  if (logins.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Jurnal</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Kalender kinerja harian dari deal penutupan MetaTrader 5 (zona WIB).
          </p>
        </header>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100/90">
          <p className="font-medium text-white">Belum ada akun MetaTrader</p>
          <p className="mt-2 text-broker-muted">
            Hubungkan EA terlebih dahulu, lalu kembali ke halaman ini.
          </p>
        </div>
      </div>
    );
  }

  const mtLoginRaw = typeof searchParams?.mtLogin === "string" ? searchParams.mtLogin.trim() : "";
  const today = jakartaTodayParts();

  let mtLogin = mtLoginRaw;
  if (!mtLogin && logins.length === 1) {
    redirect(`/profil/portfolio/journal?mtLogin=${encodeURIComponent(logins[0]!)}`);
  }
  if (!mtLogin) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Jurnal</h1>
          <p className="mt-1 text-sm text-broker-muted">Pilih akun MetaTrader untuk membuka kalender jurnal.</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {logins.map((login) => (
            <Link
              key={login}
              href={`/profil/portfolio/journal?mtLogin=${encodeURIComponent(login)}`}
              className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-muted">Login MetaTrader</p>
              <p className="mt-2 font-mono text-lg font-semibold text-broker-accent">{login}</p>
              <p className="mt-2 text-xs text-broker-muted">Buka jurnal →</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!logins.includes(mtLogin)) {
    redirect("/profil/portfolio/journal");
  }

  const y = Number.parseInt(String(searchParams?.y ?? ""), 10);
  const m = Number.parseInt(String(searchParams?.m ?? ""), 10);
  const d = Number.parseInt(String(searchParams?.d ?? ""), 10);

  const year = Number.isFinite(y) && y >= 2000 && y <= 2100 ? y : today.y;
  const month = Number.isFinite(m) && m >= 1 && m <= 12 ? m : today.m;
  const day = Number.isFinite(d) && d >= 1 ? clampDay(year, month, d) : clampDay(year, month, today.d);

  const { start, end } = jakartaMonthUtcRange(year, month);

  const [currencySnap, raw] = await Promise.all([
    prisma.mtAccountSnapshot.findFirst({
      where: { userId, mtLogin },
      orderBy: { recordedAt: "desc" },
      select: { currency: true, brokerName: true, brokerServer: true },
    }),
    prisma.mtDeal.findMany({
      where: {
        userId,
        mtLogin,
        dealTime: { gte: start, lte: end },
        dealType: { in: [0, 1] },
        entryType: { in: [1, 3] },
      },
      orderBy: { dealTime: "asc" },
      select: {
        id: true,
        ticket: true,
        dealTime: true,
        symbol: true,
        dealType: true,
        entryType: true,
        volume: true,
        commission: true,
        swap: true,
        profit: true,
        price: true,
        magic: true,
        comment: true,
      },
    }),
  ]);

  const accountCurrency =
    currencySnap?.currency && String(currencySnap.currency).trim()
      ? String(currencySnap.currency).trim().toUpperCase()
      : null;
  const brokerName =
    currencySnap?.brokerName && String(currencySnap.brokerName).trim()
      ? String(currencySnap.brokerName).trim()
      : null;
  const brokerServer =
    currencySnap?.brokerServer && String(currencySnap.brokerServer).trim()
      ? String(currencySnap.brokerServer).trim()
      : null;

  const deals: JournalDealRow[] = raw
    .filter(isClosingDeal)
    .map((row) => {
      const dr = {
        dealTime: row.dealTime,
        symbol: row.symbol,
        dealType: row.dealType,
        entryType: row.entryType,
        volume: row.volume,
        price: row.price,
        commission: row.commission,
        swap: row.swap,
        profit: row.profit,
      };
      return {
        id: row.id,
        ticket: row.ticket,
        dayKey: jakartaDayKey(row.dealTime),
        dealTimeIso: row.dealTime.toISOString(),
        symbol: row.symbol,
        dealType: row.dealType,
        volume: num(row.volume),
        swap: num(row.swap),
        commission: num(row.commission),
        profit: num(row.profit),
        net: dealNet(dr),
        magic: row.magic,
        comment: row.comment ?? "",
      };
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Jurnal</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Deal penutupan (OUT / OUT_BY) per hari kalender WIB.{" "}
            {logins.length > 1 ? (
              <Link href="/profil/portfolio/journal" className="text-broker-accent hover:underline">
                Ganti akun
              </Link>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-broker-muted">
            Akun <span className="text-broker-accent">{mtLogin}</span>
            {accountCurrency ? (
              <>
                <span className="mx-2 text-broker-border">·</span>
                <span>
                  Nominal <span className="font-semibold text-white">{accountCurrency}</span>
                </span>
              </>
            ) : null}
          </p>
          <PortfolioAccountBrokerLine
            brokerName={brokerName}
            brokerServer={brokerServer}
            explainIfMissing
            className="mt-2 text-right"
          />
        </div>
      </header>

      <PortfolioJournalClient mtLogin={mtLogin} year={year} month={month} day={day} deals={deals} />
    </div>
  );
}
