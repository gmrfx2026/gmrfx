import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HomeNewsStatus } from "@prisma/client";
import { articleProseTypographyClass } from "@/lib/articleProseClassName";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { homeNewsAuthorForDisplay } from "@/lib/homeNewsAuthor";
import { resolvePublicDisplayUrl } from "@/lib/publicUploadUrl";
import { BeritaHeroImage } from "@/components/berita/BeritaHeroImage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const row = await prisma.homeNewsItem.findFirst({
    where: { slug: params.slug, status: HomeNewsStatus.PUBLISHED },
    select: { title: true, excerpt: true },
  });
  if (!row) return { title: "Berita" };
  const description = row.excerpt?.trim() || row.title;
  return { title: row.title, description };
}

export default async function BeritaDetailPage({ params }: { params: { slug: string } }) {
  const row = await prisma.homeNewsItem.findFirst({
    where: { slug: params.slug, status: HomeNewsStatus.PUBLISHED },
    include: { author: { select: { id: true, name: true, memberSlug: true } } },
  });
  if (!row) notFound();

  const safeHtml = sanitizeArticleHtml(row.contentHtml);
  const label = row.scope === "DOMESTIC" ? "Berita dalam negeri" : "Berita internasional";
  const penulis = homeNewsAuthorForDisplay(row.author);
  const heroSrc = row.imageUrl ? resolvePublicDisplayUrl(row.imageUrl) ?? row.imageUrl : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-wider text-broker-accent">{label}</p>
      <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">{row.title}</h1>
      <p className="mt-3 text-sm text-broker-muted">
        <Link href={penulis.href} className="text-broker-accent hover:underline">
          {penulis.label}
        </Link>
        {row.publishedAt ? (
          <>
            {" · "}
            {formatJakarta(row.publishedAt, { dateStyle: "long" })}
          </>
        ) : null}
        {row.sourceUrl ? (
          <>
            {" · "}
            <a
              href={row.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-broker-accent hover:underline"
            >
              Sumber
            </a>
          </>
        ) : null}
      </p>
      {heroSrc ? <BeritaHeroImage src={heroSrc} title={row.title} /> : null}
      <div
        className={`${articleProseTypographyClass} mt-8`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      <p className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-sm text-broker-muted">
        <Link href="/berita" className="text-broker-accent hover:underline">
          Semua berita
        </Link>
        <Link href="/" className="text-broker-accent hover:underline">
          Beranda
        </Link>
      </p>
    </article>
  );
}
