import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Mencatat kunjungan halaman /go (tanpa auth). */
export async function POST(req: Request) {
  let visitorId: string | null = null;
  try {
    const body = (await req.json().catch(() => ({}))) as { visitorId?: unknown };
    if (typeof body.visitorId === "string" && body.visitorId.length > 0 && body.visitorId.length <= 80) {
      visitorId = body.visitorId;
    }
  } catch {
    /* ignore */
  }

  const referer = req.headers.get("referer")?.slice(0, 500) ?? null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  try {
    await prisma.affiliateGoClick.create({
      data: { visitorId, referer, userAgent },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
