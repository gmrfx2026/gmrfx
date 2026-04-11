import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, HomeNewsScope, HomeNewsStatus } from "@prisma/client";
import { MemberTicker } from "@/components/MemberTicker";
import {
  HOME_INDICATORS_VISIBLE_KEY,
  HOME_MEMBER_TICKER_VISIBLE_KEY,
  HOME_NEWS_DOMESTIC_VISIBLE_KEY,
  HOME_NEWS_INTERNATIONAL_VISIBLE_KEY,
  HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY,
  isHomeIndicatorsVisible,
  isHomeMemberTickerVisible,
  isHomeNewsDomesticVisible,
  isHomeNewsInternationalVisible,
  parseHomeNewsHomepagePerBlock,
} from "@/lib/homePageSettings";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { marketplaceDescriptionPlainExcerpt } from "@/lib/marketplaceDescription";
import { resolveMarketplaceIndicatorCoverUrl } from "@/lib/marketplaceCoverImage";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { homeNewsAuthorForDisplay } from "@/lib/homeNewsAuthor";
import { homeNewsDisplayImageUrl, imgReferrerPolicyForSrc } from "@/lib/homeNewsDisplayImage";
import {
  HOME_HERO_EYEBROW_KEY,
  HOME_HERO_SUBTEXT_KEY,
  HOME_HERO_TITLE_KEY,
  resolveHomeHeroFromSettings,
} from "@/lib/homeHeroSettings";
/** Konten beranda (data + JSX). Dipakai dari `app/page.tsx` di luar layout `(site)`. */
export async function HomePageContent() {
  const visRows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          HOME_MEMBER_TICKER_VISIBLE_KEY,
          HOME_INDICATORS_VISIBLE_KEY,
          HOME_NEWS_DOMESTIC_VISIBLE_KEY,
          HOME_NEWS_INTERNATIONAL_VISIBLE_KEY,
          HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY,
          HOME_HERO_EYEBROW_KEY,
          HOME_HERO_TITLE_KEY,
          HOME_HERO_SUBTEXT_KEY,
        ],
      },
    },
  });
  const vis = (key: string) => visRows.find((r) => r.key === key)?.value ?? null;
  const showHomeIndicators = isHomeIndicatorsVisible(vis(HOME_INDICATORS_VISIBLE_KEY));
  const showMemberTicker = isHomeMemberTickerVisible(vis(HOME_MEMBER_TICKER_VISIBLE_KEY));
  const showDomesticNews = isHomeNewsDomesticVisible(vis(HOME_NEWS_DOMESTIC_VISIBLE_KEY));
  const showIntlNews = isHomeNewsInternationalVisible(vis(HOME_NEWS_INTERNATIONAL_VISIBLE_KEY));
  const newsPerBlock = parseHomeNewsHomepagePerBlock(vis(HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY));
  const hero = resolveHomeHeroFromSettings({
    eyebrow: vis(HOME_HERO_EYEBROW_KEY),
    title: vis(HOME_HERO_TITLE_KEY),
    subtext: vis(HOME_HERO_SUBTEXT_KEY),
  });

  const [articles, domesticNews, intlNews, members, homeIndicators] = await Promise.all([
    prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: { author: { select: { name: true } } },
    }),
    showDomesticNews
      ? prisma.homeNewsItem.findMany({
          where: { scope: HomeNewsScope.DOMESTIC, status: HomeNewsStatus.PUBLISHED },
          orderBy: { publishedAt: "desc" },
          take: newsPerBlock,
          include: { author: { select: { id: true, name: true, memberSlug: true } } },
        })
      : Promise.resolve([]),
    showIntlNews
      ? prisma.homeNewsItem.findMany({
          where: { scope: HomeNewsScope.INTERNATIONAL, status: HomeNewsStatus.PUBLISHED },
          orderBy: { publishedAt: "desc" },
          take: newsPerBlock,
          include: { author: { select: { id: true, name: true, memberSlug: true } } },
        })
      : Promise.resolve([]),
    showMemberTicker
      ? prisma.user.findMany({
          where: { role: "USER", profileComplete: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { name: true, kabupaten: true },
        })
      : Promise.resolve([]),
    showHomeIndicators
      ? prisma.sharedIndicator.findMany({
          where: { published: true },
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            priceIdr: true,
            platform: true,
            coverImageUrl: true,
            seller: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="min-w-0">
      <section className="border-b border-broker-border bg-broker-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-broker-accent">{hero.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-broker-muted md:text-lg whitespace-pre-wrap">{hero.subtext}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/daftar"
              className="rounded-lg bg-broker-accent px-6 py-3 text-sm font-semibold text-broker-bg transition hover:bg-broker-accentDim"
            >
              Mulai daftar
            </Link>
            <Link
              href="/artikel"
              className="rounded-lg border border-broker-border px-6 py-3 text-sm font-medium text-white transition hover:border-broker-accent hover:text-broker-accent"
            >
              Baca artikel
            </Link>
          </div>
        </div>
      </section>

      {showMemberTicker ? <MemberTicker members={members} /> : null}

      {showHomeIndicators ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold text-white md:text-2xl">Indikator</h2>
            <Link href="/indikator" className="text-sm font-medium text-broker-accent hover:underline">
              Lihat semua
            </Link>
          </div>
          {homeIndicators.length === 0 ? (
            <p className="text-center text-sm text-broker-muted">Belum ada indikator yang dipublikasikan.</p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {homeIndicators.map((r) => {
                const price = Number(r.priceIdr);
                const excerpt = marketplaceDescriptionPlainExcerpt(r.description, 120);
                const cover = resolveMarketplaceIndicatorCoverUrl(r.coverImageUrl, r.slug);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/indikator/${r.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
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
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-semibold text-white group-hover:text-broker-accent">{r.title}</h3>
                        <p className="mt-1 text-xs text-broker-muted">
                          {r.seller.name ?? "Member"} · {formatMarketplacePlatformLabel(r.platform)} ·{" "}
                          {price <= 0 ? (
                            <span className="text-emerald-400/90">Gratis</span>
                          ) : (
                            <>Rp {price.toLocaleString("id-ID")}</>
                          )}
                        </p>
                        {excerpt ? (
                          <p className="mt-2 line-clamp-2 flex-1 text-sm text-broker-muted">{excerpt}</p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <section
        className={`mx-auto max-w-6xl px-4 py-14 ${showHomeIndicators ? "border-t border-broker-border" : ""}`}
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">Artikel terbaru</h2>
          </div>
          <Link href="/artikel" className="text-sm font-medium text-broker-accent hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/artikel/${a.slug}`}
              className="group flex flex-col rounded-xl border border-broker-border bg-broker-surface/40 p-5 transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
            >
              <h3 className="font-semibold text-white group-hover:text-broker-accent">{a.title}</h3>
              {a.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-broker-muted">{a.excerpt}</p>
              )}
              <p className="mt-auto pt-4 text-xs text-broker-muted">
                {a.author.name ?? "Redaksi"} ·{" "}
                {a.publishedAt ? formatJakarta(a.publishedAt, { dateStyle: "medium" }) : ""}
              </p>
            </Link>
          ))}
        </div>
        {articles.length === 0 && (
          <p className="text-center text-sm text-broker-muted">Belum ada artikel yang dipublikasikan.</p>
        )}
      </section>

      {showDomesticNews ? (
        <section id="berita-dalam-negeri" className="border-t border-broker-border bg-broker-surface/20">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-xl font-bold text-white md:text-2xl">Berita dalam negeri</h2>
              <Link
                href="/berita?scope=domestic"
                className="text-sm font-medium text-broker-accent hover:underline"
              >
                Lihat semua
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {domesticNews.map((n) => {
                const penulis = homeNewsAuthorForDisplay(n.author);
                const newsImg = homeNewsDisplayImageUrl(n);
                return (
                  <div
                    key={n.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
                  >
                    <Link href={`/berita/${n.slug}`} className="flex min-h-0 flex-1 flex-col">
                      {newsImg ? (
                        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-broker-border bg-black/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={newsImg}
                            alt=""
                            referrerPolicy={imgReferrerPolicyForSrc(newsImg)}
                            className="h-full w-full object-cover transition group-hover:opacity-95"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-semibold text-white group-hover:text-broker-accent">{n.title}</h3>
                        {n.excerpt ? (
                          <p className="mt-2 line-clamp-2 text-sm text-broker-muted">{n.excerpt}</p>
                        ) : null}
                      </div>
                    </Link>
                    <div className="px-5 pb-5 text-xs text-broker-muted">
                      <Link href={penulis.href} className="text-broker-accent hover:underline">
                        {penulis.label}
                      </Link>
                      {n.publishedAt ? (
                        <>
                          {" · "}
                          {formatJakarta(n.publishedAt, { dateStyle: "medium" })}
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {domesticNews.length === 0 && (
              <p className="text-center text-sm text-broker-muted">Belum ada berita dalam negeri.</p>
            )}
          </div>
        </section>
      ) : null}

      {showIntlNews ? (
        <section
          id="berita-internasional"
          className={`mx-auto max-w-6xl px-4 py-14 ${!showDomesticNews ? "border-t border-broker-border" : ""}`}
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold text-white md:text-2xl">Berita internasional</h2>
            <Link
              href="/berita?scope=international"
              className="text-sm font-medium text-broker-accent hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {intlNews.map((n) => {
              const penulis = homeNewsAuthorForDisplay(n.author);
              const newsImg = homeNewsDisplayImageUrl(n);
              return (
                <div
                  key={n.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
                >
                  <Link href={`/berita/${n.slug}`} className="flex min-h-0 flex-1 flex-col">
                    {newsImg ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-broker-border bg-black/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={newsImg}
                          alt=""
                          referrerPolicy={imgReferrerPolicyForSrc(newsImg)}
                          className="h-full w-full object-cover transition group-hover:opacity-95"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-semibold text-white group-hover:text-broker-accent">{n.title}</h3>
                      {n.excerpt ? (
                        <p className="mt-2 line-clamp-2 text-sm text-broker-muted">{n.excerpt}</p>
                      ) : null}
                    </div>
                  </Link>
                  <div className="px-5 pb-5 text-xs text-broker-muted">
                    <Link href={penulis.href} className="text-broker-accent hover:underline">
                      {penulis.label}
                    </Link>
                    {n.publishedAt ? (
                      <>
                        {" · "}
                        {formatJakarta(n.publishedAt, { dateStyle: "medium" })}
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {intlNews.length === 0 && (
            <p className="text-center text-sm text-broker-muted">Belum ada berita internasional.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
