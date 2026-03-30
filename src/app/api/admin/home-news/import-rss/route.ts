import { NextResponse } from "next/server";
import { HomeNewsScope } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { importRssHomeNewsFeed } from "@/lib/importRssHomeNews";

export const runtime = "nodejs";
/** Impor + parafrase bisa lama; naikkan di Vercel Pro bila perlu. */
export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    feedUrl?: string;
    scope?: string;
    maxItems?: number;
    paraphrase?: boolean;
  };

  const feedUrl = String(body.feedUrl ?? "").trim();
  if (!feedUrl.startsWith("http://") && !feedUrl.startsWith("https://")) {
    return NextResponse.json({ error: "feedUrl harus URL http(s)" }, { status: 400 });
  }

  const scope =
    body.scope === "INTERNATIONAL" ? HomeNewsScope.INTERNATIONAL : HomeNewsScope.DOMESTIC;
  const maxItems = typeof body.maxItems === "number" ? body.maxItems : 8;
  const paraphrase = Boolean(body.paraphrase);

  try {
    const result = await importRssHomeNewsFeed(prisma, {
      feedUrl,
      scope,
      maxItems,
      paraphrase,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Gagal mengambil RSS";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
