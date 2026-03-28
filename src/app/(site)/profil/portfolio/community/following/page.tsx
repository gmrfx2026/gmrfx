import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PortfolioCommunityFollowingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profil/portfolio/community/following");
  }

  const follows = await prisma.mtCopyFollow.findMany({
    where: { followerUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      publisherUser: { select: { id: true, name: true, memberSlug: true } },
    },
  });

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
          .
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
          {follows.map((f) => (
            <li
              key={f.id}
              className="flex flex-col gap-2 rounded-2xl border border-broker-border/80 bg-broker-surface/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-lg font-semibold text-broker-accent">MT {f.mtLogin}</p>
                <p className="text-sm text-white">
                  Pemilik: {f.publisherUser.name ?? "Member"}{" "}
                  {f.publisherUser.memberSlug ? (
                    <Link
                      href={`/${f.publisherUser.memberSlug}`}
                      className="text-broker-accent hover:underline"
                    >
                      @{f.publisherUser.memberSlug}
                    </Link>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-broker-muted">
                  {Number(f.paidAmountIdr) > 0
                    ? `Dibayar: Rp ${Number(f.paidAmountIdr).toLocaleString("id-ID")} (wallet)`
                    : "Gratis"}
                  {" · "}
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
                    f.createdAt
                  )}
                </p>
              </div>
              <Link
                href="/profil/portfolio/community/accounts"
                className="shrink-0 text-xs font-medium text-broker-accent hover:underline"
              >
                Lihat komunitas →
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-broker-muted">
        Relasi tersimpan di server untuk langkah berikutnya (EA mirror). Harga berbayar dipotong dari saldo
        wallet IDR Anda sekali saat Anda menekan Copy.
      </p>
    </div>
  );
}
