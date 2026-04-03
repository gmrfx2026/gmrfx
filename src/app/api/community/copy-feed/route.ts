import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashMt5ApiToken } from "@/lib/mt5Token";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/copy-feed
 * Authorization: Bearer <copy token per langganan>
 *
 * Mengembalikan posisi terbuka dari satu publisher spesifik.
 * Token ini didapat saat klik tombol Copy di website, unik per langganan.
 *
 * Satu EA = satu token = satu publisher.
 * Untuk copy banyak publisher gunakan beberapa EA instance (magic number berbeda).
 *
 * Mendukung ETag / 304 Not Modified.
 */

function bearerToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return "";
}

export async function GET(req: Request) {
  const raw = bearerToken(req);
  if (raw.length < 16) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hash = hashMt5ApiToken(raw);

  const follow = await prisma.mtCopyFollow.findFirst({
    where: {
      copyTokenHash: hash,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      publisherUserId: true,
      mtLogin: true,
      expiresAt: true,
      publisherUser: { select: { name: true, memberSlug: true } },
    },
  });

  if (!follow) {
    return NextResponse.json(
      { error: "Token tidak valid, sudah kedaluwarsa, atau langganan tidak aktif." },
      { status: 401 }
    );
  }

  // Verifikasi publisher masih aktif mengizinkan copy
  const pub = await prisma.mtCommunityPublishedAccount.findFirst({
    where: {
      userId: follow.publisherUserId,
      mtLogin: follow.mtLogin,
      allowCopy: true,
    },
    select: { displayName: true },
  });

  if (!pub) {
    return NextResponse.json(
      { error: "Publisher telah menonaktifkan layanan copy untuk akun ini." },
      { status: 403 }
    );
  }

  const row = await prisma.mtTradingActivity.findUnique({
    where: {
      userId_mtLogin: { userId: follow.publisherUserId, mtLogin: follow.mtLogin },
    },
  });

  const etag = row ? `"${row.recordedAt.getTime()}"` : `"empty"`;
  const ifNoneMatch = req.headers.get("if-none-match") ?? "";
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "no-store" },
    });
  }

  const displayName =
    pub.displayName?.trim() ||
    follow.publisherUser.name?.trim() ||
    "";

  const body = JSON.stringify({
    ok: true,
    ownerId: follow.publisherUserId,
    mtLogin: follow.mtLogin,
    displayName,
    expiresAt: follow.expiresAt?.toISOString() ?? null,
    activity: tradingActivityFromRow(row),
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": "no-store",
    },
  });
}
