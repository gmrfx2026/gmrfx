import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";

export const dynamic = "force-dynamic";

/**
 * Aktivitas akun publikasi komunitas — polling ringkasan publik.
 * Mendukung ETag (If-None-Match) agar EA CopyTrader bisa skip parse
 * jika snapshot tidak berubah → 304 Not Modified, body kosong.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const mtLogin = url.searchParams.get("mtLogin")?.trim() ?? "";
  if (!ownerId || !mtLogin) {
    return NextResponse.json({ error: "ownerId dan mtLogin wajib" }, { status: 400 });
  }

  const pub = await prisma.mtCommunityPublishedAccount.findFirst({
    where: {
      userId: ownerId,
      mtLogin,
      OR: [{ allowCopy: true }, { allowWatch: true }],
      user: { ...listablePublicMemberWhere },
    },
    select: { id: true },
  });

  if (!pub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.mtTradingActivity.findUnique({
    where: { userId_mtLogin: { userId: ownerId, mtLogin } },
  });

  // ETag berbasis recordedAt — EA bisa kirim If-None-Match untuk skip parsing
  const etag = row ? `"${row.recordedAt.getTime()}"` : `"empty"`;
  const ifNoneMatch = req.headers.get("if-none-match") ?? "";
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        "ETag": etag,
        "Cache-Control": "no-store",
      },
    });
  }

  const body = JSON.stringify({
    ok: true,
    activity: tradingActivityFromRow(row),
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "ETag": etag,
      "Cache-Control": "no-store",
    },
  });
}
