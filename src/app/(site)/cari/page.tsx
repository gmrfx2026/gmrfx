import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, MemberStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cari — GMR FX",
  description: "Pencarian artikel dan member GMR FX",
};

export default async function CariPage({
  searchParams,
}: {
  searchParams: { q?: string | string[] };
}) {
  const raw = searchParams.q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();

  const articles =
    q.length >= 2
      ? await prisma.article.findMany({
          where: {
            status: ArticleStatus.PUBLISHED,
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { excerpt: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: 25,
          select: { slug: true, title: true, excerpt: true, publishedAt: true },
        })
      : [];

  const members =
    q.length >= 2
      ? await prisma.user.findMany({
          where: {
            memberStatus: MemberStatus.ACTIVE,
            profileComplete: true,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { memberSlug: { contains: q, mode: "insensitive" } },
              { kabupaten: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { name: "asc" },
          take: 25,
          select: { id: true, name: true, memberSlug: true, kabupaten: true },
        })
      : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Cari</h1>
      <p className="mt-2 text-sm text-broker-muted">Artikel terbit dan member aktif (minimal 2 karakter).</p>

      <form method="get" action="/cari" className="mt-8 flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Kata kunci…"
          className="min-w-0 flex-1 rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white placeholder:text-broker-muted/60"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg"
        >
          Cari
        </button>
      </form>

      {!q && (
        <p className="mt-8 text-sm text-broker-muted">Masukkan kata kunci lalu tekan Cari.</p>
      )}

      {q && q.length < 2 && (
        <p className="mt-8 text-sm text-broker-danger">Gunakan setidaknya 2 karakter.</p>
      )}

      {q.length >= 2 && (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-white">Artikel</h2>
            {articles.length === 0 ? (
              <p className="mt-2 text-sm text-broker-muted">Tidak ada artikel yang cocok.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/artikel/${a.slug}`} className="text-broker-accent hover:underline">
                      {a.title}
                    </Link>
                    {a.excerpt && <p className="mt-1 line-clamp-2 text-sm text-broker-muted">{a.excerpt}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Member</h2>
            {members.length === 0 ? (
              <p className="mt-2 text-sm text-broker-muted">Tidak ada member yang cocok.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {members.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={m.memberSlug ? `/${m.memberSlug}` : `/member/${m.id}`}
                      className="text-broker-accent hover:underline"
                    >
                      {m.name ?? "Member"}
                    </Link>
                    {m.kabupaten && <span className="ml-2 text-sm text-broker-muted">· {m.kabupaten}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
