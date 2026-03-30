import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, HomeNewsScope, HomeNewsStatus } from "@prisma/client";
import { MemberTicker } from "@/components/MemberTicker";
import { HOME_MEMBER_TICKER_VISIBLE_KEY, isHomeMemberTickerVisible } from "@/lib/homePageSettings";
import { formatJakarta } from "@/lib/jakartaDateFormat";

/** Konten beranda (data + JSX). Dipakai dari `app/page.tsx` di luar layout `(site)`. */
export async function HomePageContent() {
  const tickerRow = await prisma.systemSetting.findUnique({
    where: { key: HOME_MEMBER_TICKER_VISIBLE_KEY },
  });
  const showMemberTicker = isHomeMemberTickerVisible(tickerRow?.value ?? null);

  const [articles, domesticNews, intlNews, members] = await Promise.all([
    prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: { author: { select: { name: true } } },
    }),
    prisma.homeNewsItem.findMany({
      where: { scope: HomeNewsScope.DOMESTIC, status: HomeNewsStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.homeNewsItem.findMany({
      where: { scope: HomeNewsScope.INTERNATIONAL, status: HomeNewsStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    showMemberTicker
      ? prisma.user.findMany({
          where: { role: "USER", profileComplete: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { name: true, kabupaten: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <section className="border-b border-broker-border bg-broker-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-broker-accent">
            Forex & CFD education
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
            Belajar forex dengan gaya platform broker profesional
          </h1>
          <p className="mt-4 max-w-2xl text-broker-muted md:text-lg">
            Tampilan menginspirasi Exness & IC Markets: gelap, kontras, aksen hijau. Daftar untuk artikel
            member, wallet IDR, dan fitur komunitas yang akan terus dikembangkan.
          </p>
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

      <section className="mx-auto max-w-6xl px-4 py-14">
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

      <section id="berita-dalam-negeri" className="border-t border-broker-border bg-broker-surface/20">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold text-white md:text-2xl">Berita dalam negeri</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {domesticNews.map((n) => (
              <Link
                key={n.id}
                href={`/berita/${n.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
              >
                {n.imageUrl ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-broker-border bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={n.imageUrl}
                      alt=""
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
                  <p className="mt-auto pt-4 text-xs text-broker-muted">
                    {n.publishedAt ? formatJakarta(n.publishedAt, { dateStyle: "medium" }) : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {domesticNews.length === 0 && (
            <p className="text-center text-sm text-broker-muted">Belum ada berita dalam negeri.</p>
          )}
        </div>
      </section>

      <section id="berita-internasional" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-white md:text-2xl">Berita internasional</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {intlNews.map((n) => (
            <Link
              key={n.id}
              href={`/berita/${n.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40 hover:bg-broker-surface/70"
            >
              {n.imageUrl ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-broker-border bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.imageUrl}
                    alt=""
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
                <p className="mt-auto pt-4 text-xs text-broker-muted">
                  {n.publishedAt ? formatJakarta(n.publishedAt, { dateStyle: "medium" }) : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {intlNews.length === 0 && (
          <p className="text-center text-sm text-broker-muted">Belum ada berita internasional.</p>
        )}
      </section>
    </div>
  );
}
