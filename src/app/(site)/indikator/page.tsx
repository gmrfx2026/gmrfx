import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { marketplaceDescriptionPlainExcerpt } from "@/lib/marketplaceDescription";
import { isAllowedMarketplaceCoverSrc } from "@/lib/marketplaceCoverImage";

export const dynamic = "force-dynamic";

export default async function IndikatorCatalogPage() {
  const rows = await prisma.sharedIndicator.findMany({
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
      coverImageUrl: true,
      updatedAt: true,
      seller: {
        select: { id: true, name: true, memberSlug: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Indikator & file strategi</h1>
      <p className="mt-2 max-w-2xl text-sm text-broker-muted">
        File dari member GMR FX. Indikator gratis bisa diunduh setelah login; yang berbayar memakai saldo wallet
        IDR ke penjual.
      </p>
      <p className="mt-2 text-sm text-broker-muted">
        Untuk{" "}
        <Link href="/ea" className="text-broker-accent hover:underline">
          Expert Advisor (EA)
        </Link>{" "}
        buka katalog terpisah.
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-broker-muted">Belum ada indikator yang dipublikasikan.</p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const price = Number(r.priceIdr);
            const excerpt = marketplaceDescriptionPlainExcerpt(r.description, 160);
            const cover =
              r.coverImageUrl && isAllowedMarketplaceCoverSrc(r.coverImageUrl) ? r.coverImageUrl : null;
            return (
              <li key={r.id}>
                <Link
                  href={`/indikator/${r.slug}`}
                  className="block overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/60"
                >
                  {cover ? (
                    <div className="relative aspect-[16/9] w-full border-b border-broker-border/60 bg-broker-bg">
                      <Image
                        src={cover}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="p-4">
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
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-sm text-broker-muted">
        Ingin menjual indikator? Buka{" "}
        <Link href="/profil?tab=indikator" className="text-broker-accent hover:underline">
          Dashboard → Indikator
        </Link>
        .
      </p>
    </div>
  );
}
