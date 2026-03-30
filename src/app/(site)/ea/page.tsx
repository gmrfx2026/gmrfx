import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { marketplaceDescriptionPlainExcerpt } from "@/lib/marketplaceDescription";

export const dynamic = "force-dynamic";

export default async function EaCatalogPage() {
  const rows = await prisma.sharedExpertAdvisor.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      priceIdr: true,
      platform: true,
      updatedAt: true,
      seller: {
        select: { id: true, name: true, memberSlug: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Expert Advisor (EA)</h1>
      <p className="mt-2 max-w-2xl text-sm text-broker-muted">
        Robot trading dari member GMR FX. EA gratis diunduh setelah login; yang berbayar memakai saldo wallet
        IDR ke penjual.
      </p>
      <p className="mt-2 text-sm text-broker-muted">
        Lihat juga{" "}
        <Link href="/indikator" className="text-broker-accent hover:underline">
          katalog indikator
        </Link>
        .
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-broker-muted">Belum ada EA yang dipublikasikan.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const price = Number(r.priceIdr);
            const excerpt = marketplaceDescriptionPlainExcerpt(r.description, 160);
            return (
              <li key={r.id}>
                <Link
                  href={`/ea/${r.slug}`}
                  className="block rounded-xl border border-broker-border bg-broker-surface/40 p-4 transition hover:border-broker-accent/40 hover:bg-broker-surface/60"
                >
                  <p className="font-semibold text-white">{r.title}</p>
                  <p className="mt-1 text-xs text-broker-muted">
                    Oleh{" "}
                    <span className="text-broker-accent/90">{r.seller.name ?? "Member"}</span> ·{" "}
                    {formatMarketplacePlatformLabel(r.platform)} ·{" "}
                    {price <= 0 ? (
                      <span className="text-emerald-400/90">Gratis</span>
                    ) : (
                      <>Rp {price.toLocaleString("id-ID")}</>
                    )}
                  </p>
                  {excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm text-broker-muted">{excerpt}</p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-sm text-broker-muted">
        Ingin menjual EA? Buka{" "}
        <Link href="/profil?tab=expert" className="text-broker-accent hover:underline">
          Dashboard → Expert Advisor
        </Link>
        .
      </p>
    </div>
  );
}
