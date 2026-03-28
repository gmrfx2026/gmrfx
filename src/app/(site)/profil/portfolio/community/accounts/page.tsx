import Link from "next/link";
import { auth } from "@/auth";
import { fetchCommunityPublishedAccounts } from "@/lib/communityCopyAccounts";
import { CommunityCopyFollowButton } from "@/components/portfolio/CommunityCopyFollowButton";

export const dynamic = "force-dynamic";

export default async function PortfolioCommunityAccountsPage() {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const rows = await fetchCommunityPublishedAccounts(viewerId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Akun komunitas</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Akun trading yang pemiliknya mengizinkan copy. Untuk mempublikasikan akun Anda, buka{" "}
            <Link href="/profil/portfolio/community/publish" className="text-broker-accent hover:underline">
              Publikasi copy trade
            </Link>
            .
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 px-6 py-12 text-center text-sm text-broker-muted">
          <p className="font-medium text-white">Belum ada akun yang dipublikasikan</p>
          <p className="mx-auto mt-2 max-w-md">
            Saat member lain mengaktifkan &quot;izinkan Copy&quot;, baris akan muncul di sini dengan tombol{" "}
            <strong className="text-broker-accent">Copy</strong> (gratis atau berbayar lewat wallet IDR).
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-broker-border/80 bg-broker-surface/40 shadow-inner shadow-black/20">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-broker-border/80 bg-broker-bg/40 text-xs uppercase tracking-wide text-broker-muted">
                <th className="px-3 py-3 font-medium">Nama / pemilik</th>
                <th className="px-3 py-3 font-medium">Platform</th>
                <th className="px-3 py-3 font-medium">Mode</th>
                <th className="px-3 py-3 font-medium">Metode</th>
                <th className="px-3 py-3 font-medium">Gain</th>
                <th className="px-3 py-3 font-medium">Harian</th>
                <th className="px-3 py-3 font-medium">Drawdown</th>
                <th className="px-3 py-3 font-medium">Saldo</th>
                <th className="px-3 py-3 font-medium">Net PnL</th>
                <th className="px-3 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.publisherUserId}-${r.mtLogin}`} className="border-b border-broker-border/40 last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-broker-accent/90">{r.displayName}</p>
                    <p className="text-xs text-broker-muted">
                      {r.publisherName ?? "Member"}{" "}
                      {r.publisherSlug ? (
                        <Link
                          href={`/${r.publisherSlug}`}
                          className="text-broker-accent hover:underline"
                        >
                          @{r.publisherSlug}
                        </Link>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] text-broker-muted">MT {r.mtLogin}</p>
                  </td>
                  <td className="px-3 py-2.5 text-broker-muted">{r.platformLabel}</td>
                  <td className="px-3 py-2.5 text-broker-muted">{r.modeLabel}</td>
                  <td className="px-3 py-2.5 text-broker-muted">{r.methodLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-broker-muted">{r.gainLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-broker-muted">{r.dailyLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-broker-danger/80">{r.ddLabel}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-white">
                    {r.balanceLabel}
                    {r.currency ? (
                      <span className="ml-1 text-[10px] text-broker-muted">{r.currency}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-white">
                    {r.pnlLabel}
                    {r.currency ? (
                      <span className="ml-1 text-[10px] text-broker-muted">{r.currency}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right align-top">
                    {viewerId ? (
                      <CommunityCopyFollowButton
                        publisherUserId={r.publisherUserId}
                        mtLogin={r.mtLogin}
                        copyFree={r.copyFree}
                        copyPriceIdr={r.copyPriceIdr}
                        alreadyFollowing={r.alreadyFollowing}
                      />
                    ) : (
                      <Link
                        href={`/login?callbackUrl=/profil/portfolio/community/accounts`}
                        className="inline-block rounded-lg border border-broker-accent/40 px-3 py-1.5 text-xs font-semibold text-broker-accent hover:bg-broker-accent/10"
                      >
                        Login untuk Copy
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-broker-muted">
        <strong className="text-broker-muted">Copy</strong> menyimpan relasi di situs (gratis atau potong wallet).
        Eksekusi order mirror di terminal Anda masih memerlukan EA copy terpisah yang membaca konfigurasi dari
        server — langkah itu bisa ditambahkan kemudian.
      </p>
    </div>
  );
}
