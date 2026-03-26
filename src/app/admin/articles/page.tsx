import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminArticleRow } from "@/components/admin/AdminArticleRow";
import { AdminListFilterForm, AdminListSummary } from "@/components/admin/AdminListFilterForm";
import { AdminPaginationNav } from "@/components/admin/AdminPaginationNav";
import { parseAdminListQuery, resolvePagedWindow } from "@/lib/adminListParams";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string; perPage?: string; q?: string };
}) {
  const lp = parseAdminListQuery(searchParams as Record<string, string | string[] | undefined>);
  const q = lp.q;

  const where: Prisma.ArticleWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          {
            author: {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        ],
      }
    : {};

  const total = await prisma.article.count({ where });
  const { page, skip, totalPages } = resolvePagedWindow(lp.page, lp.pageSize, total);

  const articles = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: lp.pageSize,
    include: { author: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Artikel</h1>
      <p className="mt-1 text-sm text-gray-600">
        Artikel member menunggu approval. Admin dapat mengedit dan menerbitkan.
      </p>

      <AdminListFilterForm
        actionPath="/admin/articles"
        qDefault={lp.q}
        perPageDefault={lp.pageSize}
        searchPlaceholder="Judul, slug, ringkasan, penulis…"
      />
      <AdminListSummary total={total} page={page} pageSize={lp.pageSize} totalPages={totalPages} />

      <div className="mt-6 space-y-3">
        {articles.map((a) => (
          <AdminArticleRow key={a.id} article={a} />
        ))}
      </div>

      <AdminPaginationNav path="/admin/articles" page={page} totalPages={totalPages} perPage={lp.pageSize} q={lp.q} />
    </div>
  );
}
