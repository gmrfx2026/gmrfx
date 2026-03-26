import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, CommentTarget } from "@prisma/client";
import { articleProseTypographyClass } from "@/lib/articleProseClassName";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { ArticleInteractions } from "@/components/ArticleInteractions";
import { ArticleRatingSummary } from "@/components/ArticleRatingSummary";
import { getArticleCommentsPerPage } from "@/lib/articleCommentPagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findFirst({
    where: { slug: params.slug, status: ArticleStatus.PUBLISHED },
    select: { title: true, excerpt: true },
  });
  if (!article) return { title: "Artikel" };
  const description = article.excerpt?.trim() || `Artikel: ${article.title}`;
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
    },
  };
}

export default async function ArtikelDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { cPage?: string };
}) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const article = await prisma.article.findFirst({
    where: { slug: params.slug, status: ArticleStatus.PUBLISHED },
    include: {
      author: { select: { id: true, name: true } },
      ratings: true,
    },
  });

  if (!article) notFound();

  const pageSize = await getArticleCommentsPerPage();

  const commentWhere = {
    targetType: CommentTarget.ARTICLE,
    articleId: article.id,
    hidden: false,
  };

  const commentTotal = await prisma.comment.count({ where: commentWhere });
  const totalPages = Math.max(1, Math.ceil(commentTotal / pageSize) || 1);

  const rawPage = searchParams?.cPage;
  let requested =
    rawPage === "last"
      ? totalPages
      : Math.max(1, Number.parseInt(String(rawPage ?? "1"), 10) || 1);
  if (!Number.isFinite(requested)) requested = 1;
  const commentPage = Math.min(requested, totalPages);

  const comments = await prisma.comment.findMany({
    where: commentWhere,
    orderBy: { createdAt: "asc" },
    skip: (commentPage - 1) * pageSize,
    take: pageSize,
    include: { user: { select: { name: true } } },
  });

  const EDIT_WINDOW_MS = 15 * 60 * 1000;
  const now = Date.now();

  const safeHtml = sanitizeArticleHtml(article.contentHtml);
  const ratingCount = article.ratings.length;
  const avg =
    ratingCount > 0 ? article.ratings.reduce((s, r) => s + r.stars, 0) / ratingCount : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-wider text-broker-accent">Artikel</p>
      <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">{article.title}</h1>
      <p className="mt-3 text-sm text-broker-muted">
        {article.author.name ?? "Redaksi"} ·{" "}
        {article.publishedAt
          ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(article.publishedAt)
          : ""}
        <ArticleRatingSummary avg={avg} count={ratingCount} />
      </p>
      <div
        className={`${articleProseTypographyClass} mt-8`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      <ArticleInteractions
        articleSlug={article.slug}
        articleId={article.id}
        articleAuthorId={article.authorId}
        commentPage={commentPage}
        commentPageSize={pageSize}
        commentTotal={commentTotal}
        commentTotalPages={totalPages}
        initialComments={comments.map((c) => {
          const own = viewerId != null && c.userId === viewerId;
          const within = now - new Date(c.createdAt).getTime() <= EDIT_WINDOW_MS;
          return {
            id: c.id,
            userId: c.userId,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            user: { name: c.user.name },
            canEditOrDelete: own && within,
          };
        })}
      />
    </article>
  );
}
