import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PortfolioAccountBrokerLine } from "@/components/portfolio/PortfolioAccountBrokerLine";
import { mt5DealEntryLabel, mt5DealTypeLabel } from "@/lib/mt5DealLabels";
import { redirect } from "next/navigation";
import { formatJakarta } from "@/lib/jakartaDateFormat";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

function fmtNum(n: unknown, maxFrac = 5): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("id-ID", { maximumFractionDigits: maxFrac });
}

function fmtDt(d: Date): string {
  return formatJakarta(d, {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function tradeLogPageHref(pageNum: number, mtLogin: string | null, ticket: string | null) {
  const q = new URLSearchParams();
  q.set("page", String(pageNum));
  if (mtLogin) q.set("mtLogin", mtLogin);
  if (ticket) q.set("ticket", ticket);
  return `/profil/portfolio/trade-log?${q.toString()}`;
}

export default async function PortfolioTradeLogPage({
  searchParams,
}: {
  searchParams: { page?: string; mtLogin?: string; ticket?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil/portfolio/trade-log");

  const page = Math.max(1, Number.parseInt(String(searchParams?.page ?? "1"), 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const mtLoginRaw = searchParams?.mtLogin;
  const mtLoginFilter =
    typeof mtLoginRaw === "string" && mtLoginRaw.trim().length > 0 ? mtLoginRaw.trim() : null;

  const ticketRaw = searchParams?.ticket;
  const ticketFilter =
    typeof ticketRaw === "string" && ticketRaw.trim().length > 0 ? ticketRaw.trim() : null;

  const dealWhere = {
    userId: session.user.id,
    ...(mtLoginFilter ? { mtLogin: mtLoginFilter } : {}),
    ...(ticketFilter ? { ticket: ticketFilter } : {}),
  };

  const [total, deals, currencySnap] = await Promise.all([
    prisma.mtDeal.count({ where: dealWhere }),
    prisma.mtDeal.findMany({
      where: dealWhere,
      orderBy: { dealTime: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    mtLoginFilter
      ? prisma.mtAccountSnapshot.findFirst({
          where: { userId: session.user.id, mtLogin: mtLoginFilter },
          orderBy: { recordedAt: "desc" },
          select: { currency: true, brokerName: true, brokerServer: true },
        })
      : Promise.resolve(null),
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Trade log</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Data dari EA (MetaTrader). Total{" "}
          <span className="font-semibold text-white">{total}</span> deal tersimpan
          {mtLoginFilter ? (
            <>
              {" "}
              untuk login <span className="font-mono font-semibold text-white">{mtLoginFilter}</span>
              {accountCurrency ? (
                <>
                  {" "}
                  (nominal <span className="font-semibold text-white">{accountCurrency}</span>)
                </>
              ) : null}
              {ticketFilter ? (
                <>
                  , ticket <span className="font-mono font-semibold text-white">{ticketFilter}</span>
                </>
              ) : null}
              {" — "}
              <Link
                href={
                  ticketFilter && mtLoginFilter
                    ? `/profil/portfolio/trade-log?mtLogin=${encodeURIComponent(mtLoginFilter)}`
                    : "/profil/portfolio/trade-log"
                }
                className="text-broker-accent hover:underline"
              >
                {ticketFilter ? "hapus filter ticket" : "lihat semua akun"}
              </Link>
              .
            </>
          ) : (
            "."
          )}
        </p>
        {mtLoginFilter ? (
          <PortfolioAccountBrokerLine
            brokerName={brokerName}
            brokerServer={brokerServer}
            explainIfMissing
            className="mt-2"
          />
        ) : null}
      </header>

      {total === 0 ? null : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-broker-border/80 bg-broker-surface/40 shadow-inner shadow-black/20">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-broker-border/80 bg-broker-bg/50 text-[10px] uppercase tracking-wide text-broker-muted sm:text-xs">
                  <th className="px-2 py-2.5 font-medium">Waktu</th>
                  <th className="px-2 py-2.5 font-medium">Login MT</th>
                  <th className="px-2 py-2.5 font-medium">Simbol</th>
                  <th className="px-2 py-2.5 font-medium">Tipe</th>
                  <th className="px-2 py-2.5 font-medium">Entry</th>
                  <th className="px-2 py-2.5 text-right font-medium">Lot</th>
                  <th className="px-2 py-2.5 text-right font-medium">Harga</th>
                  <th className="px-2 py-2.5 text-right font-medium">Komisi</th>
                  <th className="px-2 py-2.5 text-right font-medium">Swap</th>
                  <th className="px-2 py-2.5 text-right font-medium">Profit</th>
                  <th className="px-2 py-2.5 font-medium">Magic</th>
                  <th className="min-w-[6rem] px-2 py-2.5 font-medium">Komentar</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => {
                  const profit = Number(d.profit);
                  const profitCls =
                    profit > 0
                      ? "text-emerald-400"
                      : profit < 0
                        ? "text-red-400"
                        : "text-broker-muted";
                  return (
                    <tr key={d.id} className="border-b border-broker-border/30 text-broker-muted">
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-white sm:text-xs">
                        {fmtDt(d.dealTime)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-white">{d.mtLogin}</td>
                      <td className="px-2 py-2 font-medium text-broker-accent">{d.symbol}</td>
                      <td className="px-2 py-2">{mt5DealTypeLabel(d.dealType)}</td>
                      <td className="px-2 py-2">{mt5DealEntryLabel(d.entryType)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(d.volume)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(d.price, 8)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(d.commission)}</td>
                      <td className="px-2 py-2 text-right font-mono">{fmtNum(d.swap)}</td>
                      <td className={`px-2 py-2 text-right font-mono font-medium ${profitCls}`}>
                        {fmtNum(d.profit)}
                      </td>
                      <td className="px-2 py-2 font-mono">{d.magic}</td>
                      <td className="max-w-[10rem] truncate px-2 py-2 text-broker-muted/90" title={d.comment}>
                        {d.comment || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              {page > 1 ? (
                <Link
                  href={tradeLogPageHref(page - 1, mtLoginFilter, ticketFilter)}
                  className="rounded-lg border border-broker-border px-3 py-1.5 text-broker-accent hover:bg-broker-surface/50"
                >
                  ← Sebelumnya
                </Link>
              ) : null}
              <span className="text-broker-muted">
                Halaman {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={tradeLogPageHref(page + 1, mtLoginFilter, ticketFilter)}
                  className="rounded-lg border border-broker-border px-3 py-1.5 text-broker-accent hover:bg-broker-surface/50"
                >
                  Berikutnya →
                </Link>
              ) : null}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
