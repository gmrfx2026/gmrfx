import Link from "next/link";
import { auth } from "@/auth";
import {
  fetchCommunityPublishedAccounts,
  type CommunityPublishedAccountView,
  type MetricTone,
} from "@/lib/communityCopyAccounts";
import { CommunityActivityWatchButton } from "@/components/portfolio/CommunityActivityWatchButton";
import { CommunityCopyFollowButton } from "@/components/portfolio/CommunityCopyFollowButton";
import clsx from "clsx";

export const dynamic = "force-dynamic";

function toneClass(t: MetricTone): string {
  switch (t) {
    case "up":
      return "text-emerald-400";
    case "down":
      return "text-broker-danger";
    case "flat":
      return "text-broker-muted";
    default:
      return "text-broker-muted";
  }
}

function communityAccountSummaryHref(r: CommunityPublishedAccountView): string {
  return `/profil/portfolio/community/account/${encodeURIComponent(r.publisherUserId)}/${encodeURIComponent(r.mtLogin)}`;
}

/** Hanya nama akun (tanpa nomor MetaTrader di daftar); klik → ringkasan statistik. */
function AccountNameCell({ row: r }: { row: CommunityPublishedAccountView }) {
  const href = communityAccountSummaryHref(r);
  const hint = [r.displayName, r.publisherSlug ? `@${r.publisherSlug}` : r.publisherName].filter(Boolean).join(" · ");
  return (
    <Link
      href={href}
      className="block min-w-0 truncate text-sm font-medium text-broker-accent hover:underline"
      title={hint ? `${hint} — buka ringkasan` : "Buka ringkasan"}
    >
      {r.displayName}
    </Link>
  );
}

export default async function PortfolioCommunityAccountsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const pageRaw = typeof searchParams?.page === "string" ? searchParams.page : "1";
  const page = Math.max(1, Number.parseInt(pageRaw, 10) || 1);

  const bundle = await fetchCommunityPublishedAccounts(viewerId, { page });

  const basePath = "/profil/portfolio/community/accounts";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Akun komunitas</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Nomor login MetaTrader tidak ditampilkan di daftar; klik <strong className="text-white">nama akun</strong> untuk
            ringkasan statistik. Untuk mempublikasikan akun Anda, buka{" "}
            <Link href="/profil/portfolio/community/publish" className="text-broker-accent hover:underline">
              Publikasi copy trade
            </Link>
            .
          </p>
        </div>
        {bundle.total > 0 ? (
          <p className="text-xs text-broker-muted">
            Menampilkan{" "}
            <span className="font-mono text-white">
              {(page - 1) * bundle.pageSize + 1}–{Math.min(page * bundle.pageSize, bundle.total)}
            </span>{" "}
            dari <span className="font-mono text-white">{bundle.total}</span> akun
          </p>
        ) : null}
      </header>

      {bundle.rows.length === 0 ? (
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 px-6 py-12 text-center text-sm text-broker-muted">
          <p className="font-medium text-white">Belum ada akun yang dipublikasikan</p>
          <p className="mx-auto mt-2 max-w-md">
            Saat pemilik mengaktifkan <strong className="text-white">Copy</strong> dan/atau{" "}
            <strong className="text-white">Ikuti</strong> di halaman publikasi, akun muncul di sini dengan tombol
            sesuai pengaturan mereka.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-broker-border/80 bg-broker-surface/40 shadow-inner shadow-black/20">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-broker-border/80 bg-broker-bg/40 text-[10px] uppercase tracking-wide text-broker-muted sm:text-xs">
                  <th className="px-2 py-3 font-medium sm:px-3">Nama akun</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Platform</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Mode</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Metode</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Skor</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Gain</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Harian</th>
                  <th className="px-2 py-3 font-medium sm:px-3">DD saldo</th>
                  <th className="px-2 py-3 font-medium sm:px-3">DD equity</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Saldo</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Net PnL</th>
                  <th className="px-2 py-3 font-medium sm:px-3">Aktivitas</th>
                  <th className="px-2 py-3 text-right font-medium sm:px-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bundle.rows.map((r) => (
                  <tr
                    key={`${r.publisherUserId}-${r.mtLogin}`}
                    className="border-b border-broker-border/40 last:border-0"
                  >
                    <td className="max-w-[11rem] min-w-[7rem] px-2 py-2.5 sm:max-w-[22rem] sm:px-3">
                      <AccountNameCell row={r} />
                    </td>
                    <td className="px-2 py-2.5 text-broker-muted sm:px-3">{r.platformLabel}</td>
                    <td className="px-2 py-2.5 text-broker-muted sm:px-3">{r.modeLabel}</td>
                    <td className="px-2 py-2.5 text-broker-muted sm:px-3">{r.methodLabel}</td>
                    <td className="px-2 py-2.5 font-mono text-xs text-white sm:px-3">{r.scoreLabel}</td>
                    <td
                      className={clsx(
                        "px-2 py-2.5 font-mono text-xs sm:px-3",
                        toneClass(r.gainTone)
                      )}
                    >
                      {r.gainLabel}
                    </td>
                    <td
                      className={clsx(
                        "px-2 py-2.5 font-mono text-xs sm:px-3",
                        toneClass(r.dailyTone)
                      )}
                    >
                      {r.dailyLabel}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-broker-danger/85 sm:px-3">
                      {r.ddBalLabel}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-broker-danger/85 sm:px-3">
                      {r.ddEqLabel}
                    </td>
                    <td className="px-2 py-2.5 font-mono text-xs text-white sm:px-3">
                      {r.balanceLabel}
                      {r.currency ? (
                        <span className="ml-1 text-[10px] text-broker-muted">{r.currency}</span>
                      ) : null}
                    </td>
                    <td
                      className={clsx(
                        "px-2 py-2.5 font-mono text-xs sm:px-3",
                        toneClass(r.pnlTone)
                      )}
                    >
                      {r.pnlLabel}
                      {r.currency ? (
                        <span className="ml-1 text-[10px] text-broker-muted">{r.currency}</span>
                      ) : null}
                    </td>
                    <td className="max-w-[7rem] px-2 py-2.5 text-xs text-broker-muted sm:px-3">
                      {r.activityLabel}
                    </td>
                    <td className="px-2 py-2.5 text-right align-top sm:px-3">
                      <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                        {viewerId ? (
                          <>
                            {r.allowWatch ? (
                              <CommunityActivityWatchButton
                                publisherUserId={r.publisherUserId}
                                mtLogin={r.mtLogin}
                                initiallyWatching={r.activityWatching}
                                watchAlertFree={r.watchAlertFree}
                                watchAlertPriceIdr={r.watchAlertPriceIdr}
                              />
                            ) : null}
                            {r.allowCopy ? (
                              <CommunityCopyFollowButton
                                publisherUserId={r.publisherUserId}
                                mtLogin={r.mtLogin}
                                copyFree={r.copyFree}
                                copyPriceIdr={r.copyPriceIdr}
                                alreadyFollowing={r.alreadyFollowing}
                              />
                            ) : null}
                          </>
                        ) : (
                          <Link
                            href={`/login?callbackUrl=/profil/portfolio/community/accounts`}
                            className="inline-block rounded-lg border border-broker-accent/40 px-2 py-1 text-[10px] font-semibold text-broker-accent hover:bg-broker-accent/10 sm:text-xs"
                          >
                            Login untuk Copy / Ikuti
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bundle.totalPages > 1 ? (
            <nav
              className="flex flex-wrap items-center justify-end gap-3 text-xs text-broker-muted"
              aria-label="Paginasi akun komunitas"
            >
              {bundle.page > 1 ? (
                <Link
                  href={`${basePath}?page=${bundle.page - 1}`}
                  className="rounded-lg border border-broker-border/70 px-3 py-1.5 font-medium text-broker-accent hover:bg-broker-surface/60"
                >
                  ← Sebelumnya
                </Link>
              ) : (
                <span className="rounded-lg border border-broker-border/30 px-3 py-1.5 opacity-40">
                  ← Sebelumnya
                </span>
              )}
              <span className="font-mono text-white">
                {bundle.page} / {bundle.totalPages}
              </span>
              {bundle.page < bundle.totalPages ? (
                <Link
                  href={`${basePath}?page=${bundle.page + 1}`}
                  className="rounded-lg border border-broker-border/70 px-3 py-1.5 font-medium text-broker-accent hover:bg-broker-surface/60"
                >
                  Berikutnya →
                </Link>
              ) : (
                <span className="rounded-lg border border-broker-border/30 px-3 py-1.5 opacity-40">
                  Berikutnya →
                </span>
              )}
            </nav>
          ) : null}
        </>
      )}

      <p className="text-xs text-broker-muted">
        <strong className="text-broker-muted">Skor</strong> adalah ringkasan internal (bukan rating pihak ketiga).
        Metrik gain/harian/drawdown mengikuti agregasi yang sama dengan dashboard portofolio (zona waktu UTC untuk
        periode harian).         <strong className="text-broker-muted">Ikuti</strong> memberi toast dan notifikasi saat akun
        tersebut membuka atau menutup posisi (bunyi beep mengikuti pengaturan beep chat di kotak chat).
        Harga Ikuti bisa gratis atau berbayar — diatur pemilik di{" "}
        <Link href="/profil/portfolio/community/publish" className="text-broker-accent hover:underline">
          Publikasi copy trade
        </Link>{" "}
        dan terpisah dari harga Copy. Layanan berbayar berlangganan ~30 hari per pembayaran; saat habis Anda
        mendapat notifikasi dan email.{" "}
        <strong className="text-broker-muted">Copy</strong> menyimpan relasi di situs; mirror order di terminal tetap
        lewat EA terpisah jika Anda tambahkan nanti.
      </p>
    </div>
  );
}
