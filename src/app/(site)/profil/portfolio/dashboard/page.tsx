import Link from "next/link";
import clsx from "clsx";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { buildPortfolioStatsModel } from "@/lib/mt5Stats";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";
import { DeletePortfolioMtAccountButton } from "@/components/portfolio/DeletePortfolioMtAccountButton";
import { PortfolioAccountStatsBoard } from "@/components/portfolio/PortfolioAccountStatsBoard";

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

export default async function PortfolioDashboardPage({
  searchParams,
}: {
  searchParams: { mtLogin?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil/portfolio/dashboard");

  const userId = session.user.id;
  const logins = await linkedLogins(userId);

  const mtLoginParam = typeof searchParams?.mtLogin === "string" ? searchParams.mtLogin.trim() : "";

  if (logins.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Dashboard portofolio</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Statistik akun muncul setelah EA mengirim deal atau snapshot ke server.
          </p>
        </header>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100/90">
          <p className="font-medium text-white">Belum ada akun MT terhubung</p>
          <p className="mt-2 text-broker-muted">
            Pasang token di{" "}
            <Link href="/profil/portfolio/summary" className="text-broker-accent hover:underline">
              Ringkasan
            </Link>{" "}
            dan aktifkan EA. Lalu buka{" "}
            <Link href="/profil/portfolio/trade-log" className="text-broker-accent hover:underline">
              Trade log
            </Link>{" "}
            untuk memastikan data masuk.
          </p>
        </div>
      </div>
    );
  }

  if (logins.length === 1 && !mtLoginParam) {
    redirect(`/profil/portfolio/dashboard?mtLogin=${encodeURIComponent(logins[0]!)}`);
  }

  if (mtLoginParam && !logins.includes(mtLoginParam)) {
    redirect("/profil/portfolio/dashboard");
  }

  if (!mtLoginParam) {
    const snapHints = await prisma.mtAccountSnapshot.findMany({
      where: { userId, mtLogin: { in: logins } },
      orderBy: { recordedAt: "desc" },
      select: { mtLogin: true, tradeAccountName: true },
    });
    const tradeNameByLogin = new Map<string, string>();
    for (const s of snapHints) {
      if (tradeNameByLogin.has(s.mtLogin)) continue;
      const n = s.tradeAccountName?.trim();
      if (n) tradeNameByLogin.set(s.mtLogin, n);
    }

    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Dashboard portofolio</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Pilih akun MT untuk melihat statistik agregat (aliran mirip journal trading profesional).
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {logins.map((login) => {
            const tradeLabel = tradeNameByLogin.get(login);
            return (
              <div
                key={login}
                className="flex flex-col overflow-hidden rounded-2xl border border-broker-border/80 bg-broker-surface/50 shadow-md transition hover:border-broker-accent/40"
              >
                <Link
                  href={`/profil/portfolio/dashboard?mtLogin=${encodeURIComponent(login)}`}
                  className="flex-1 p-4 transition hover:bg-broker-surface/70"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-muted">Akun MT</p>
                  {tradeLabel ? (
                    <p className="mt-2 truncate text-lg font-semibold text-broker-accent" title={tradeLabel}>
                      {tradeLabel}
                    </p>
                  ) : null}
                  <p
                    className={clsx(
                      "font-mono text-sm font-semibold text-white/90",
                      tradeLabel ? "mt-1" : "mt-2 text-lg text-broker-accent"
                    )}
                    title="Nomor login MetaTrader"
                  >
                    {login}
                  </p>
                  <p className="mt-2 text-xs text-broker-muted">Buka statistik &amp; grafik →</p>
                </Link>
                <div className="border-t border-broker-border/50 px-4 py-2 text-center">
                  <DeletePortfolioMtAccountButton mtLogin={login} redirectHref="/profil/portfolio/dashboard" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const mtLogin = mtLoginParam;

  const [deals, snaps, actRow] = await Promise.all([
    prisma.mtDeal.findMany({
      where: { userId, mtLogin },
      orderBy: { dealTime: "asc" },
      select: {
        dealTime: true,
        symbol: true,
        dealType: true,
        entryType: true,
        volume: true,
        price: true,
        commission: true,
        swap: true,
        profit: true,
      },
    }),
    prisma.mtAccountSnapshot.findMany({
      where: { userId, mtLogin },
      orderBy: { recordedAt: "asc" },
      select: {
        recordedAt: true,
        balance: true,
        equity: true,
        currency: true,
        brokerName: true,
        brokerServer: true,
        tradeAccountName: true,
      },
    }),
    prisma.mtTradingActivity.findUnique({
      where: { userId_mtLogin: { userId, mtLogin } },
    }),
  ]);

  const model = buildPortfolioStatsModel(deals, snaps, mtLogin);
  const activity = tradingActivityFromRow(actRow);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Dashboard portofolio</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Statistik dihitung dari deal &amp; snapshot yang tersimpan.{" "}
            {logins.length > 1 ? (
              <Link href="/profil/portfolio/dashboard" className="text-broker-accent hover:underline">
                Ganti akun
              </Link>
            ) : null}
          </p>
          <div className="mt-2">
            <DeletePortfolioMtAccountButton
              mtLogin={mtLogin}
              redirectHref="/profil/portfolio/dashboard"
              className="text-xs font-medium text-red-400/90 underline decoration-red-400/40 underline-offset-2 hover:text-red-300 disabled:opacity-50"
            />
          </div>
        </div>
      </header>

      <PortfolioAccountStatsBoard
        model={model}
        activity={activity}
        activityPoll={{
          url: `/api/portfolio/mt-activity?mtLogin=${encodeURIComponent(mtLogin)}`,
          intervalMs: 10_000,
        }}
      />
    </div>
  );
}
