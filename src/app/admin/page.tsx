import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CommentTarget } from "@prisma/client";
import { formatJakarta } from "@/lib/jakartaDateFormat";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [users, articles, pending, gallery, recentComments, newMembers] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.article.count({ where: { status: "PENDING" } }),
    prisma.galleryImage.count(),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        article: { select: { title: true, slug: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Ringkasan cepat — gaya Bootstrap / admin klasik.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Member" value={users} href="/admin/members" />
        <StatCard title="Artikel" value={articles} href="/admin/articles" />
        <StatCard title="Menunggu approval" value={pending} href="/admin/articles" />
        <StatCard title="Gambar galeri" value={gallery} href="/admin/gallery" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-800">Komentar terbaru</h2>
            <Link href="/admin/comments" className="text-xs text-blue-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {recentComments.map((c) => (
              <li key={c.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <p className="text-xs text-gray-500">
                  {formatJakarta(c.createdAt, { dateStyle: "short", timeStyle: "short" })}
                  {c.hidden ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">disembunyikan</span>
                  ) : null}
                </p>
                <p className="mt-1 font-medium text-gray-800">{c.user.name ?? "—"}</p>
                <p className="line-clamp-2 text-gray-600">{c.content}</p>
                {c.targetType === CommentTarget.ARTICLE && c.article ? (
                  <Link href={`/artikel/${c.article.slug}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                    {c.article.title}
                  </Link>
                ) : (
                  <span className="mt-1 inline-block text-xs text-gray-500">Status / lainnya</span>
                )}
              </li>
            ))}
          </ul>
          {recentComments.length === 0 && <p className="mt-4 text-sm text-gray-500">Belum ada komentar.</p>}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-800">Member baru</h2>
            <Link href="/admin/members" className="text-xs text-blue-600 hover:underline">
              Daftar member
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {newMembers.map((u) => (
              <li key={u.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-800">{u.name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatJakarta(u.createdAt, { dateStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
          {newMembers.length === 0 && <p className="mt-4 text-sm text-gray-500">Belum ada data.</p>}
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-green-400"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
    </Link>
  );
}
