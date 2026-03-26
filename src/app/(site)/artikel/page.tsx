import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Artikel — GMR FX",
  description: "Daftar artikel edukasi forex dan CFD dari redaksi dan member.",
  openGraph: { title: "Artikel — GMR FX", description: "Materi edukasi forex yang dipublikasikan." },
};

export const dynamic = "force-dynamic";

export default async function ArtikelListPage() {
  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Artikel</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Materi edukasi forex. Artikel dari member menunggu persetujuan admin.
      </p>
      <ul className="mt-10 space-y-4">
        {articles.map((a) => (
          <li key={a.id}>
            <Link
              href={`/artikel/${a.slug}`}
              className="block rounded-xl border border-broker-border bg-broker-surface/40 p-5 transition hover:border-broker-accent/50"
            >
              <h2 className="font-semibold text-white">{a.title}</h2>
              {a.excerpt && <p className="mt-2 text-sm text-broker-muted">{a.excerpt}</p>}
              <p className="mt-3 text-xs text-broker-muted">
                {a.author.name ?? "Anonim"} ·{" "}
                {a.publishedAt
                  ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(a.publishedAt)
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {articles.length === 0 && (
        <p className="mt-8 text-center text-broker-muted">Belum ada artikel.</p>
      )}
    </div>
  );
}
