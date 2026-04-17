import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { HomeNewsScope, HomeNewsStatus } from "@prisma/client";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { homeNewsAuthorForDisplay } from "@/lib/homeNewsAuthor";
import { resolveHomeNewsCardImageSrc } from "@/lib/homeNewsImage";

export const metadata: Metadata = {
  title: "Berita — GMR FX",
  description: "Ringkasan berita dalam negeri dan internasional terkait pasar & ekonomi.",
  openGraph: { title: "Berita — GMR FX", description: "Berita beranda GMR FX." },
};

export const dynamic = "force-dynamic";

type ScopeFilter = "all" | "domestic" | "international";

function parseScope(raw: string | string[] | undefined): ScopeFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const norm = String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  if (norm === "domestic" || norm === "dalam-negeri" || norm === "dn") return "domestic";
  if (
    norm === "international" ||
    norm === "internasional" ||
    norm === "intl" ||
    norm === "global"
  ) {
    return "international";
  }
  return "all";
}

export default async function BeritaListPage({
  searchParams,
}: {
  searchParams: { scope?: string | string[] };
}) {
  const filter = parseScope(searchParams?.scope);
  const scopeWhere =
    filter === "domestic"
      ? HomeNewsScope.DOMESTIC
      : filter === "international"
        ? HomeNewsScope.INTERNATIONAL
        : undefined;

  const items = await prisma.homeNewsItem.findMany({
    where: {
      status: HomeNewsStatus.PUBLISHED,
      ...(scopeWhere !== undefined ? { scope: scopeWhere } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 120,
    include: { author: { select: { id: true, name: true, memberSlug: true } } },
  });

  const tab = (active: ScopeFilter, label: string, href: string) => (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        filter === active
          ? "bg-broker-accent text-broker-bg"
          : "border border-broker-border text-broker-muted hover:border-broker-accent/50 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Berita</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Kumpulan berita yang ditampilkan di beranda. Sumber asli tersedia di tiap halaman.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {tab("all", "Semua", "/berita")}
        {tab("domestic", "Dalam negeri", "/berita?scope=domestic")}
        {tab("international", "Internasional", "/berita?scope=international")}
      </div>

      <ul className="mt-10 space-y-4">
        {items.map((n) => {
          const penulis = homeNewsAuthorForDisplay(n.author);
          const newsImg = resolveHomeNewsCardImageSrc(n);
          return (
            <li
              key={n.id}
              className="overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/50"
            >
              <Link
                href={`/berita/${n.slug}`}
                className="flex flex-col gap-3 p-5 sm:flex-row"
              >
                {newsImg ? (
                  <div className="shrink-0 overflow-hidden rounded-lg border border-broker-border sm:w-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newsImg}
                      alt=""
                      className="h-28 w-full object-cover sm:h-24 sm:w-40"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-broker-accent">
                    {n.scope === "DOMESTIC" ? "Dalam negeri" : "Internasional"}
                  </p>
                  <h2 className="mt-1 font-semibold text-white">{n.title}</h2>
                  {n.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-broker-muted">{n.excerpt}</p> : null}
                </div>
              </Link>
              <div className="border-t border-broker-border px-5 py-3 text-xs text-broker-muted">
                <Link href={penulis.href} className="text-broker-accent hover:underline">
                  {penulis.label}
                </Link>
                {n.publishedAt ? (
                  <>
                    {" · "}
                    {formatJakarta(n.publishedAt, { dateStyle: "long" })}
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {items.length === 0 && (
        <p className="mt-8 text-center text-broker-muted">Belum ada berita untuk filter ini.</p>
      )}
    </div>
  );
}
