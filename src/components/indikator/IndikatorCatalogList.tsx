import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { marketplaceDescriptionPlainExcerpt } from "@/lib/marketplaceDescription";
import { resolveMarketplaceIndicatorCoverUrl } from "@/lib/marketplaceCoverImage";
import { MarketplaceRatingBadge } from "@/components/marketplace/MarketplaceRatingBadge";

export async function IndikatorCatalogList({ where }: { where: Prisma.SharedIndicatorWhereInput }) {
  const rows = await prisma.sharedIndicator.findMany({
    where,
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
      isGmrfxOfficial: true,
      seller: {
        select: { id: true, name: true, memberSlug: true },
      },
    },
  });

  const ids = rows.map((r) => r.id);
  const ratingGroups =
    ids.length > 0
      ? await prisma.indicatorRating.groupBy({
          by: ["indicatorId"],
          where: { indicatorId: { in: ids } },
          _avg: { stars: true },
          _count: { _all: true },
        })
      : [];
  const ratingById = new Map(
    ratingGroups.map((g) => [
      g.indicatorId,
      {
        avg: g._avg.stars != null ? Number(g._avg.stars) : null,
        count: g._count._all,
      },
    ]),
  );

  if (rows.length === 0) {
    return <p className="mt-10 text-sm text-broker-muted">Belum ada indikator yang dipublikasikan.</p>;
  }

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2">
      {rows.map((r) => {
        const price = Number(r.priceIdr);
        const excerpt = marketplaceDescriptionPlainExcerpt(r.description, 160);
        const cover = resolveMarketplaceIndicatorCoverUrl(r.coverImageUrl, r.slug);
        return (
          <li key={r.id}>
            <Link
              href={`/indikator/${r.slug}`}
              className="block overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/60"
            >
              {cover ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-broker-border/60 bg-broker-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element -- sampul SVG; next/image memblokir SVG di production */}
                  <img
                    src={cover}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : null}
              <div className="p-4">
                <p className="font-semibold text-white">{r.title}</p>
                <p className="mt-1 text-xs text-broker-muted">
                  {r.isGmrfxOfficial ? (
                    <span className="mr-1 rounded bg-violet-500/20 px-1.5 py-0.5 font-medium text-violet-300">
                      GMRFX
                    </span>
                  ) : null}
                  Oleh{" "}
                  <span className="text-broker-accent/90">{r.seller.name ?? "Member"}</span> ·{" "}
                  {formatMarketplacePlatformLabel(r.platform)} ·{" "}
                  {price <= 0 ? (
                    <span className="text-emerald-400/90">Gratis</span>
                  ) : (
                    <>Rp {price.toLocaleString("id-ID")}</>
                  )}
                </p>
                <div className="mt-2">
                  <MarketplaceRatingBadge {...(ratingById.get(r.id) ?? { avg: null, count: 0 })} />
                </div>
                {excerpt ? <p className="mt-2 line-clamp-3 text-sm text-broker-muted">{excerpt}</p> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
