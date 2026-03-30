import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatJakarta } from "@/lib/jakartaDateFormat";

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
          . Judul kartu memakai <strong className="text-white/90">nama akun</strong> dari terminal (EA) bila tersedia;
          nomor login MT tidak ditampilkan di sini.
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
        <ul className="space-y-3">
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
            return (
            <li
              key={f.id}
              className="flex flex-col gap-2 rounded-2xl border border-broker-border/80 bg-broker-surface/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
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
                    ? `Dibayar: Rp ${Number(f.paidAmountIdr).toLocaleString("id-ID")} (wallet) · langganan ~30 hari`
                    : "Gratis"}
                  {" · "}
                  {f.expiresAt
                    ? `Berlaku s.d. ${formatJakarta(f.expiresAt, { dateStyle: "medium", timeStyle: "short" })}`
                    : `Mulai ${formatJakarta(f.createdAt, { dateStyle: "medium", timeStyle: "short" })}`}
                </p>
              </div>
              <Link
                href="/profil/portfolio/community/accounts"
                className="shrink-0 text-xs font-medium text-broker-accent hover:underline"
              >
                Lihat komunitas →
              </Link>
            </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-broker-muted">
        Relasi tersimpan di server untuk langkah berikutnya (EA mirror). Harga berbayar dipotong dari saldo wallet
        IDR per periode langganan (~30 hari). Saat masa habis, Anda mendapat notifikasi dan email; untuk melanjutkan
        tekan Copy lagi di daftar komunitas. Jadwalkan pemanggilan harian ke{" "}
        <code className="rounded bg-broker-bg/80 px-1 font-mono text-[10px] text-broker-accent">
          /api/cron/community-subscriptions
        </code>{" "}
        dengan header Authorization Bearer <code className="font-mono">CRON_SECRET</code> (set di server).
      </p>
    </div>
  );
}
