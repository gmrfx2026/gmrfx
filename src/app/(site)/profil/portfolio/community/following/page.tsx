import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { CopyFollowTokenPanel } from "@/components/portfolio/CopyFollowTokenPanel";

export const dynamic = "force-dynamic";

export default async function PortfolioCommunityFollowingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profil/portfolio/community/following");
  }

  const follows = await prisma.mtCopyFollow.findMany({
    where: {
      followerUserId: session.user.id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      publisherUser: { select: { id: true, name: true, memberSlug: true } },
    },
  });

  const snapByKey = new Map<string, string | null>();
  if (follows.length > 0) {
    const pairs = follows.map((f) => ({ userId: f.publisherUserId, mtLogin: f.mtLogin }));
    const snaps = await prisma.mtAccountSnapshot.findMany({
      where: { OR: pairs },
      orderBy: { recordedAt: "desc" },
      select: { userId: true, mtLogin: true, tradeAccountName: true },
    });
    for (const s of snaps) {
      const k = `${s.userId}\t${s.mtLogin}`;
      if (!snapByKey.has(k)) {
        snapByKey.set(k, s.tradeAccountName?.trim() ? s.tradeAccountName.trim() : null);
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
          Mengikuti (copy trade)
        </h1>
        <p className="mt-1 text-sm text-broker-muted">
          Akun sumber yang Anda pilih lewat tombol Copy di{" "}
          <Link href="/profil/portfolio/community/accounts" className="text-broker-accent hover:underline">
            Komunitas → Akun
          </Link>
          . Setiap langganan memiliki <strong className="text-white/90">token EA unik</strong> — masukkan token ke EA{" "}
          <code className="rounded bg-broker-bg/80 px-1 font-mono text-[10px] text-broker-accent">
            GMRFX_CopyTrader
          </code>{" "}
          untuk mulai copy trading.
        </p>
      </header>

      {follows.length === 0 ? (
        <div className="rounded-2xl border border-broker-border/60 bg-broker-surface/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-white">Belum ada akun yang diikuti</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-broker-muted">
            Buka daftar akun komunitas dan ketuk <strong className="text-broker-accent">Copy</strong> pada akun
            yang diizinkan pemiliknya.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {follows.map((f) => {
            const snapKey = `${f.publisherUserId}\t${f.mtLogin}`;
            const tradeName = snapByKey.get(snapKey) ?? null;
            const ownerName = f.publisherUser.name?.trim() ?? "";
            const displayTitle =
              tradeName && tradeName.length > 0
                ? tradeName
                : ownerName.length > 0
                  ? ownerName
                  : "Akun trading";
            const summaryHref = `/profil/portfolio/community/account/${encodeURIComponent(f.publisherUserId)}/${encodeURIComponent(f.mtLogin)}`;

            const isExpired = f.expiresAt ? f.expiresAt.getTime() <= Date.now() : false;

            return (
              <li
                key={f.id}
                className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 px-4 py-4"
              >
                {/* Header kartu */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-white">
                      <Link href={summaryHref} className="text-broker-accent hover:underline">
                        {displayTitle}
                      </Link>
                    </p>
                    <p className="text-sm text-broker-muted">
                      Pemilik:{" "}
                      <span className="text-white/90">{f.publisherUser.name ?? "Member"}</span>
                      {f.publisherUser.memberSlug ? (
                        <>
                          {" "}
                          <Link
                            href={`/${f.publisherUser.memberSlug}`}
                            className="text-broker-accent hover:underline"
                          >
                            @{f.publisherUser.memberSlug}
                          </Link>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-broker-muted">
                      {Number(f.paidAmountIdr) > 0
                        ? `Dibayar: Rp ${Number(f.paidAmountIdr).toLocaleString("id-ID")} · `
                        : "Gratis · "}
                      {f.expiresAt ? (
                        isExpired ? (
                          <span className="text-amber-400">Kadaluarsa {formatJakarta(f.expiresAt, { dateStyle: "medium" })}</span>
                        ) : (
                          <>Berlaku s.d. {formatJakarta(f.expiresAt, { dateStyle: "medium", timeStyle: "short" })}</>
                        )
                      ) : (
                        <>Mulai {formatJakarta(f.createdAt, { dateStyle: "medium" })}</>
                      )}
                    </p>
                  </div>

                  <Link
                    href="/profil/portfolio/community/accounts"
                    className="shrink-0 text-xs font-medium text-broker-accent hover:underline"
                  >
                    Lihat komunitas →
                  </Link>
                </div>

                {/* Panel token EA */}
                <CopyFollowTokenPanel
                  followId={f.id}
                  tokenHint={f.copyTokenHint ?? null}
                  issuedAt={f.copyTokenIssuedAt ?? null}
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* Download EA */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-300">Download EA GMRFX</p>
          <p className="mt-0.5 text-xs text-broker-muted">
            File EA <code className="text-emerald-400">GMRFX_CopyTrader</code> (copier) dan{" "}
            <code className="text-emerald-400">GMRFX_TradeLogger</code> (publisher) tersedia di Google Drive.
          </p>
        </div>
        <a
          href="https://drive.google.com/drive/folders/17t8Vy_VZfPoElBMxvhyIMZ-3J0a2X8YK?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-800/40 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
          </svg>
          Download EA
        </a>
      </div>

      {/* Panduan */}
      <div className="rounded-xl border border-broker-border/40 bg-broker-surface/20 px-4 py-3 text-xs text-broker-muted space-y-1">
        <p className="font-semibold text-white/80">Cara copy trading dengan token:</p>
        <p>1. Download EA dari link di atas, pasang file <code className="text-emerald-400">.mq5</code> / <code className="text-emerald-400">.mq4</code> ke folder <code className="text-emerald-400">MQL5/Experts</code> atau <code className="text-emerald-400">MQL4/Experts</code> MetaTrader.</p>
        <p>2. Klik <strong className="text-white">Token EA CopyTrader</strong> di kartu langganan di atas untuk membuka panel token.</p>
        <p>3. Klik <strong className="text-white">Regenerasi token</strong> untuk mendapatkan token baru (token lama langsung tidak berlaku).</p>
        <p>4. Pasang EA <code className="text-emerald-400">GMRFX_CopyTrader</code> di chart MetaTrader — isi <code className="text-emerald-400">InpCopyToken</code> dengan token tersebut.</p>
        <p>5. Untuk copy beberapa publisher, pasang beberapa EA dengan token dan magic number berbeda.</p>
        <p>6. Token berlaku selama masa langganan (30 hari). Perpanjang dengan klik tombol Copy lagi di komunitas.</p>
      </div>
    </div>
  );
}
