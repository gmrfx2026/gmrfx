import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toMemberSlug } from "@/lib/memberSlug";
import { IndicatorMarketActions } from "@/components/indikator/IndicatorMarketActions";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function IndikatorDetailPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const ind = await prisma.sharedIndicator.findFirst({
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

  if (!ind) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isOwn = Boolean(userId && userId === ind.sellerId);
  const priceNum = Number(ind.priceIdr);
  const priceDec = new Decimal(ind.priceIdr.toString());

  let hasPurchase = false;
  if (userId && !isOwn && priceDec.gt(0)) {
    const p = await prisma.indicatorPurchase.findUnique({
      where: {
        indicatorId_buyerId: { indicatorId: ind.id, buyerId: userId },
      },
    });
    hasPurchase = Boolean(p);
  }

  const canDownload =
    Boolean(userId) &&
    (isOwn || priceDec.lte(0) || hasPurchase);

  const sellerSlug = ind.seller.memberSlug ?? toMemberSlug(ind.seller.name, ind.seller.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-broker-muted">
        <Link href="/indikator" className="hover:text-broker-accent">
          Indikator
        </Link>
        <span className="mx-1">/</span>
        <span className="text-broker-muted/80">{ind.title}</span>
      </p>

      <h1 className="mt-3 text-3xl font-bold text-white">{ind.title}</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Penjual:{" "}
        <Link href={`/${sellerSlug}`} className="font-medium text-broker-accent hover:underline">
          {ind.seller.name ?? "Member"}
        </Link>
        {" · "}
        {formatMarketplacePlatformLabel(ind.platform)}
        {" · "}
        {priceNum <= 0 ? (
          <span className="text-emerald-400/90">Gratis</span>
        ) : (
          <>Rp {priceNum.toLocaleString("id-ID")}</>
        )}
        {" · "}
        File: <span className="font-mono text-xs text-broker-gold/90">{ind.fileName}</span>
      </p>

      {ind.description ? (
        <div className="mt-8 rounded-xl border border-broker-border/80 bg-broker-surface/30 p-4">
          <p className="text-sm whitespace-pre-wrap text-broker-muted">{ind.description}</p>
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border border-broker-accent/25 bg-broker-accent/5 p-6">
        <IndicatorMarketActions
          indicatorId={ind.id}
          slug={ind.slug}
          priceIdr={priceNum}
          canDownload={canDownload}
          isLoggedIn={Boolean(userId)}
          isOwn={isOwn}
        />
      </div>

      <p className="mt-8 text-xs text-broker-muted/80">
        Diperbarui {ind.updatedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}
