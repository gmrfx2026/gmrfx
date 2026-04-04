import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toMemberSlug } from "@/lib/memberSlug";
import { EaMarketActions } from "@/components/ea/EaMarketActions";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { articleProseTypographyClass } from "@/lib/articleProseClassName";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { Decimal } from "@prisma/client/runtime/library";
import { MarketplaceProductStarRating } from "@/components/marketplace/MarketplaceProductStarRating";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const ea = await prisma.sharedExpertAdvisor.findFirst({
    where: { slug: decoded, published: true },
    select: { title: true, description: true },
  });
  if (!ea) return { title: "Expert Advisor" };
  const description = ea.description?.replace(/<[^>]+>/g, "").slice(0, 160).trim() || `Expert Advisor MetaTrader: ${ea.title}`;
  return {
    title: ea.title,
    description,
    openGraph: {
      title: `${ea.title} — Expert Advisor MetaTrader`,
      description,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: ea.title, description },
  };
}

export default async function EaDetailPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const ea = await prisma.sharedExpertAdvisor.findFirst({
    where: { slug: decoded, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      priceIdr: true,
      platform: true,
      fileName: true,
      updatedAt: true,
      sellerId: true,
      seller: {
        select: { id: true, name: true, memberSlug: true },
      },
    },
  });

  if (!ea) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isOwn = Boolean(userId && userId === ea.sellerId);
  const priceNum = Number(ea.priceIdr);
  const priceDec = new Decimal(ea.priceIdr.toString());

  let hasPurchase = false;
  if (userId && !isOwn && priceDec.gt(0)) {
    const p = await prisma.expertAdvisorPurchase.findUnique({
      where: {
        eaId_buyerId: { eaId: ea.id, buyerId: userId },
      },
    });
    hasPurchase = Boolean(p);
  }

  const canDownload = Boolean(userId) && (isOwn || priceDec.lte(0) || hasPurchase);

  const [ratingAgg, myRatingRow] = await Promise.all([
    prisma.eaRating.aggregate({
      where: { eaId: ea.id },
      _avg: { stars: true },
      _count: { _all: true },
    }),
    userId
      ? prisma.eaRating.findUnique({
          where: { eaId_userId: { eaId: ea.id, userId } },
          select: { stars: true },
        })
      : Promise.resolve(null),
  ]);
  const ratingAvg = ratingAgg._avg.stars != null ? Number(ratingAgg._avg.stars) : null;
  const ratingCount = ratingAgg._count._all;
  const myStars = myRatingRow?.stars ?? null;

  const sellerSlug = ea.seller.memberSlug ?? toMemberSlug(ea.seller.name, ea.seller.id);

  const descHtml = ea.description?.trim() ? sanitizeArticleHtml(ea.description) : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-broker-muted">
        <Link href="/ea" className="hover:text-broker-accent">
          Expert Advisor
        </Link>
        <span className="mx-1">/</span>
        <span className="text-broker-muted/80">{ea.title}</span>
      </p>

      <h1 className="mt-3 text-3xl font-bold text-white">{ea.title}</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Penjual:{" "}
        <Link href={`/${sellerSlug}`} className="font-medium text-broker-accent hover:underline">
          {ea.seller.name ?? "Member"}
        </Link>
        {" · "}
        {formatMarketplacePlatformLabel(ea.platform)}
        {" · "}
        {priceNum <= 0 ? (
          <span className="text-emerald-400/90">Gratis</span>
        ) : (
          <>Rp {priceNum.toLocaleString("id-ID")}</>
        )}
        {" · "}
        File: <span className="font-mono text-xs text-broker-gold/90">{ea.fileName}</span>
      </p>

      <div className="mt-4">
        <MarketplaceProductStarRating
          kind="ea"
          productId={ea.id}
          avg={ratingAvg}
          count={ratingCount}
          myStars={myStars}
          isLoggedIn={Boolean(userId)}
          isOwn={isOwn}
        />
      </div>

      {descHtml ? (
        <div className="mt-8 rounded-xl border border-broker-border/80 bg-broker-surface/30 p-4">
          <div
            className={articleProseTypographyClass}
            dangerouslySetInnerHTML={{ __html: descHtml }}
          />
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-broker-accent/25 bg-broker-accent/5 p-6">
        <EaMarketActions
          eaId={ea.id}
          slug={ea.slug}
          priceIdr={priceNum}
          canDownload={canDownload}
          isLoggedIn={Boolean(userId)}
          isOwn={isOwn}
        />
      </div>

      <p className="mt-8 text-xs text-broker-muted/80">
        Diperbarui {ea.updatedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}
