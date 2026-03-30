import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { seedEducationalArticles } from "@/lib/educationalArticlesSeed";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await seedEducationalArticles(prisma);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      count: result.count,
      penulis: result.penulis,
      authorDisplay: result.authorDisplay,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal mengimpor artikel" }, { status: 500 });
  }
}
