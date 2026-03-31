import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { isCommunitySubscriptionActive } from "@/lib/communitySubscription";

export const dynamic = "force-dynamic";

function FollowerName({
  name,
  slug,
}: {
  name: string | null;
  slug: string | null;
}) {
  const display = name?.trim() || "Member";
  if (slug?.trim()) {
    return (
      <Link href={`/${encodeURIComponent(slug.trim())}`} className="font-medium text-broker-accent hover:underline">
        {display}
      </Link>
    );
  }
  return <span className="text-white">{display}</span>;
}

export default async function CommunityMyFollowersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profil/portfolio/community/pengikut");
  }

  const publisherId = session.user.id;

  const [copies, watches] = await Promise.all([
    prisma.mtCopyFollow.findMany({
      where: { publisherUserId: publisherId },
      orderBy: [{ mtLogin: "asc" }, { createdAt: "desc" }],
      include: {
        followerUser: { select: { id: true, name: true, memberSlug: true } },
      },
    }),
    prisma.mtCommunityActivityWatch.findMany({
      where: { publisherUserId: publisherId },
      orderBy: [{ mtLogin: "asc" }, { createdAt: "desc" }],
      include: {
        follower: { select: { id: true, name: true, memberSlug: true } },
      },
    }),
  ]);

  const empty = copies.length === 0 && watches.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">Pengikut akun</h1>
        <p className="mt-1 text-sm text-broker-muted">
          Daftar member yang berlangganan <strong className="text-white">Copy trade</strong> atau{" "}
          <strong className="text-white">Ikuti</strong> pada login MetaTrader Anda. Langganan berbayar tampil status &amp;
          tanggal habis (~30 hari per periode).
        </p>
        <p className="mt-2 text-xs text-broker-muted">
          Pengaturan publikasi:{" "}
          <Link href="/profil/portfolio/community/publish" className="text-broker-accent hover:underline">
            Publikasi komunitas
          </Link>
          .
        </p>
      </header>

      {empty ? (
        <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 px-6 py-12 text-center text-sm text-broker-muted">
          <p className="font-medium text-white">Belum ada pengikut</p>
          <p className="mx-auto mt-2 max-w-md">
            Saat member lain menekan Copy atau Ikuti pada akun Anda di{" "}
            <Link href="/profil/portfolio/community/accounts" className="text-broker-accent hover:underline">
              Akun komunitas
            </Link>
            , mereka muncul di halaman ini.
          </p>
        </div>
      ) : null}

      {!empty && copies.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-broker-accent">Copy trade</h2>
          <div className="overflow-x-auto rounded-2xl border border-broker-border/80 bg-broker-surface/40">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-broker-border/80 bg-broker-bg/40 text-[10px] uppercase tracking-wide text-broker-muted">
                  <th className="px-3 py-2.5 font-medium">Login MetaTrader</th>
                  <th className="px-3 py-2.5 font-medium">Member</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Pembayaran</th>
                  <th className="px-3 py-2.5 font-medium">Mulai</th>
                </tr>
              </thead>
              <tbody>
                {copies.map((row) => {
                  const active = isCommunitySubscriptionActive(row.expiresAt);
                  return (
                    <tr key={row.id} className="border-b border-broker-border/40 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-broker-accent">{row.mtLogin}</td>
                      <td className="px-3 py-2.5">
                        <FollowerName
                          name={row.followerUser.name}
                          slug={row.followerUser.memberSlug}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-broker-muted">
                        {active ? (
                          <span className="text-emerald-400/90">Aktif</span>
                        ) : (
                          <span className="text-amber-200/90">Kedaluwarsa</span>
                        )}
                        {row.expiresAt ? (
                          <span className="mt-0.5 block text-[10px] text-broker-muted/80">
                            s.d.{" "}
                            {formatJakarta(row.expiresAt, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[10px] text-broker-muted/80">Gratis tanpa batas</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-broker-muted">
                        {Number(row.paidAmountIdr) > 0
                          ? `Rp ${Number(row.paidAmountIdr).toLocaleString("id-ID")}`
                          : "Gratis"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-broker-muted">
                        {formatJakarta(row.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!empty && watches.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-broker-accent">Ikuti (alert posisi)</h2>
          <div className="overflow-x-auto rounded-2xl border border-broker-border/80 bg-broker-surface/40">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-broker-border/80 bg-broker-bg/40 text-[10px] uppercase tracking-wide text-broker-muted">
                  <th className="px-3 py-2.5 font-medium">Login MetaTrader</th>
                  <th className="px-3 py-2.5 font-medium">Member</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Pembayaran</th>
                  <th className="px-3 py-2.5 font-medium">Mulai</th>
                </tr>
              </thead>
              <tbody>
                {watches.map((row) => {
                  const active = isCommunitySubscriptionActive(row.expiresAt);
                  return (
                    <tr key={row.id} className="border-b border-broker-border/40 last:border-0">
                      <td className="px-3 py-2.5 font-mono text-broker-accent">{row.mtLogin}</td>
                      <td className="px-3 py-2.5">
                        <FollowerName name={row.follower.name} slug={row.follower.memberSlug} />
                      </td>
                      <td className="px-3 py-2.5 text-broker-muted">
                        {active ? (
                          <span className="text-emerald-400/90">Aktif</span>
                        ) : (
                          <span className="text-amber-200/90">Kedaluwarsa</span>
                        )}
                        {row.expiresAt ? (
                          <span className="mt-0.5 block text-[10px] text-broker-muted/80">
                            s.d.{" "}
                            {formatJakarta(row.expiresAt, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[10px] text-broker-muted/80">Gratis tanpa batas</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-broker-muted">
                        {Number(row.paidAmountIdr) > 0
                          ? `Rp ${Number(row.paidAmountIdr).toLocaleString("id-ID")}`
                          : "Gratis"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-broker-muted">
                        {formatJakarta(row.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
