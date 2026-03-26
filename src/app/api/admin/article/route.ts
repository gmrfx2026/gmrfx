import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { sanitizeArticleHtml, sanitizePlainText } from "@/lib/sanitize";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.title) data.title = sanitizePlainText(String(body.title), 200);
  if (body.excerpt !== undefined) data.excerpt = body.excerpt ? sanitizePlainText(String(body.excerpt), 400) : null;
  if (body.contentHtml) data.contentHtml = sanitizeArticleHtml(String(body.contentHtml));
  if (body.status && ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"].includes(body.status)) {
    data.status = body.status as ArticleStatus;
    if (body.status === "PUBLISHED") data.publishedAt = new Date();
  }

  await prisma.article.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
