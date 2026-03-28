import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { buildPortfolioStatsModel } from "@/lib/mt5Stats";
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
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Dashboard portofolio</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Pilih akun MT untuk melihat statistik agregat (aliran mirip journal trading profesional).
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {logins.map((login) => (
            <Link
              key={login}
              href={`/profil/portfolio/dashboard?mtLogin=${encodeURIComponent(login)}`}
              className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-muted">Login MT</p>
              <p className="mt-2 font-mono text-lg font-semibold text-broker-accent">{login}</p>
              <p className="mt-2 text-xs text-broker-muted">Buka statistik &amp; grafik →</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const mtLogin = mtLoginParam;

  const [deals, snaps] = await Promise.all([
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
      },
    }),
  ]);

  const model = buildPortfolioStatsModel(deals, snaps, mtLogin);

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
        </div>
      </header>

      <PortfolioAccountStatsBoard model={model} />
    </div>
  );
}
