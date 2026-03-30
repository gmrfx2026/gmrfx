import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { sanitizePlainText } from "@/lib/sanitizePlainText";
import { slugify } from "@/lib/slug";
import { formatArticleTitle } from "@/lib/articleTitleFormat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserProfileComplete(session.user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const title = formatArticleTitle(sanitizePlainText(String(body.title ?? ""), 200));
  const excerpt = sanitizePlainText(String(body.excerpt ?? ""), 400);
  const rawHtml = String(body.contentHtml ?? "");
  if (!title || !rawHtml) {
    return NextResponse.json({ error: "Judul dan isi wajib diisi" }, { status: 400 });
  }

  const contentHtml = sanitizeArticleHtml(rawHtml);
  let slug = slugify(title);
  const exists = await prisma.article.findUnique({ where: { slug } });
  if (exists) slug = slugify(title + "-v2");

  await prisma.article.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      contentHtml,
      status: ArticleStatus.PENDING,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, slug });
}
