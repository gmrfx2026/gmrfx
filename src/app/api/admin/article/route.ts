import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { notifyFollowersNewArticle } from "@/lib/memberNotifications";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { sanitizePlainText } from "@/lib/sanitizePlainText";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  const before = await prisma.article.findUnique({
    where: { id },
    select: { status: true, authorId: true, title: true, slug: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.title) data.title = sanitizePlainText(String(body.title), 200);
  if (body.excerpt !== undefined) data.excerpt = body.excerpt ? sanitizePlainText(String(body.excerpt), 400) : null;
  if (body.contentHtml) data.contentHtml = sanitizeArticleHtml(String(body.contentHtml));
  if (body.status && ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"].includes(body.status)) {
    data.status = body.status as ArticleStatus;
    if (body.status === "PUBLISHED") data.publishedAt = new Date();
  }

  await prisma.article.update({ where: { id }, data });

  const afterStatus = (data.status as ArticleStatus | undefined) ?? before?.status;
  if (
    before &&
    before.status !== ArticleStatus.PUBLISHED &&
    afterStatus === ArticleStatus.PUBLISHED
  ) {
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, authorId: true },
    });
    if (article) {
      void notifyFollowersNewArticle({
        authorId: article.authorId,
        articleId: article.id,
        title: article.title,
        slug: article.slug,
      }).catch(() => {
        /* ignore */
      });
    }
  }

  return NextResponse.json({ ok: true });
}
