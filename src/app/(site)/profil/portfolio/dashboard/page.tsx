import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PortfolioPlaceholderPanel } from "@/components/portfolio/PortfolioPlaceholderPanel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortfolioDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil/portfolio/dashboard");

  const userId = session.user.id;

  const [dealCount, lastDeal, lastSnap, logins] = await Promise.all([
    prisma.mtDeal.count({ where: { userId } }),
    prisma.mtDeal.findFirst({
      where: { userId },
      orderBy: { dealTime: "desc" },
      select: { dealTime: true, mtLogin: true },
    }),
    prisma.mtAccountSnapshot.findFirst({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.mtDeal.groupBy({
      by: ["mtLogin"],
      where: { userId },
    }),
  ]);

  const bal = lastSnap ? Number(lastSnap.balance) : null;
  const eq = lastSnap ? Number(lastSnap.equity) : null;
  const lastSync =
    lastSnap?.recordedAt != null
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
          lastSnap.recordedAt
        )
      : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Ringkasan dari data yang sudah diterima server dari EA.{" "}
          <Link href="/profil/portfolio/trade-log" className="text-broker-accent hover:underline">
            Lihat trade log →
          </Link>
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20">
          <p className="text-xs font-medium uppercase tracking-wide text-broker-muted">Deal tersimpan</p>
          <p className="mt-2 font-mono text-lg font-semibold text-white">{dealCount}</p>
          <p className="mt-1 text-xs text-broker-muted/80">
            {lastDeal
              ? `Terakhir: ${new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(lastDeal.dealTime)}`
              : "Menunggu EA pertama kali"}
          </p>
        </div>
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20">
          <p className="text-xs font-medium uppercase tracking-wide text-broker-muted">Login MT</p>
          <p className="mt-2 font-mono text-lg font-semibold text-white">{logins.length || "—"}</p>
          <p className="mt-1 text-xs text-broker-muted/80">
            {logins.length > 0
              ? logins
                  .map((g) => g.mtLogin)
                  .slice(0, 3)
                  .join(", ") + (logins.length > 3 ? "…" : "")
              : "Belum ada"}
          </p>
        </div>
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20">
          <p className="text-xs font-medium uppercase tracking-wide text-broker-muted">Saldo (snapshot)</p>
          <p className="mt-2 font-mono text-lg font-semibold text-white">
            {bal != null && Number.isFinite(bal) ? bal.toLocaleString("id-ID", { maximumFractionDigits: 2 }) : "—"}
          </p>
          <p className="mt-1 text-xs text-broker-muted/80">
            {eq != null && Number.isFinite(eq)
              ? `Equity: ${eq.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`
              : "Dari kiriman EA terakhir"}
          </p>
        </div>
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/50 p-4 shadow-md shadow-black/20">
          <p className="text-xs font-medium uppercase tracking-wide text-broker-muted">Sinkron snapshot</p>
          <p className="mt-2 font-mono text-sm font-semibold text-white">{lastSync ?? "—"}</p>
          <p className="mt-1 text-xs text-broker-muted/80">
            {lastDeal ? `Akun: ${lastDeal.mtLogin}` : "Pasang token & EA"}
          </p>
        </div>
      </div>

      {dealCount === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Belum ada deal di database. Buka{" "}
          <Link href="/profil/portfolio/trade-log" className="font-medium underline">
            Trade log
          </Link>{" "}
          untuk panduan pengecekan EA &amp; token.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <PortfolioPlaceholderPanel title="Kalender aktivitas">
          Grid harian (hijau / merah) menyusul dari agregasi deal per tanggal.
        </PortfolioPlaceholderPanel>
        <PortfolioPlaceholderPanel title="Berita & jadwal">
          Widget ringkas — opsional nanti.
        </PortfolioPlaceholderPanel>
      </div>
    </div>
  );
}
