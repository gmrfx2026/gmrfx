import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { seedEducationalArticles, type SeedEducationalArticlesMode } from "@/lib/educationalArticlesSeed";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let mode: SeedEducationalArticlesMode = "upsert";
  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: string };
    if (body.mode === "create_new") mode = "create_new";
  } catch {
    /* body opsional */
  }

  try {
    const result = await seedEducationalArticles(prisma, { mode });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      count: result.count,
      penulis: result.penulis,
      authorDisplay: result.authorDisplay,
      mode: result.mode,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengimpor artikel" }, { status: 500 });
  }
}
