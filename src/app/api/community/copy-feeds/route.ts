import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashMt5ApiToken } from "@/lib/mt5Token";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";
import { activeCommunitySubscriptionWhere } from "@/lib/communitySubscription";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/copy-feeds
 * Authorization: Bearer <token EA copier>
 *
 * Mengembalikan semua posisi terbuka dari akun yang sedang aktif di-follow
 * oleh pemilik token. EA CopyTrader menggunakan endpoint ini — copier tidak
 * perlu tahu OwnerId / MtLogin publisher secara manual.
 *
 * Mendukung ETag / 304 Not Modified berdasarkan gabungan recordedAt semua feeds.
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

  const tokenHash = hashMt5ApiToken(raw);
  const link = await prisma.mtLinkToken.findFirst({
    where: { tokenHash, revokedAt: null },
    select: { userId: true },
  });
  if (!link) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerUserId = link.userId;

  // Ambil semua copy-follow aktif milik follower ini
  const follows = await prisma.mtCopyFollow.findMany({
    where: {
      followerUserId,
      ...activeCommunitySubscriptionWhere(),
    },
    select: {
      publisherUserId: true,
      mtLogin: true,
      expiresAt: true,
    },
  });

  if (follows.length === 0) {
    return NextResponse.json({ ok: true, feeds: [] });
  }

  // Verifikasi akun masih dipublikasikan + allowCopy masih true
  const pubAccounts = await prisma.mtCommunityPublishedAccount.findMany({
    where: {
      OR: follows.map((f) => ({ userId: f.publisherUserId, mtLogin: f.mtLogin })),
      allowCopy: true,
    },
    select: {
      userId: true,
      mtLogin: true,
      user: { select: { name: true } },
    },
  });

  const pubSet = new Set(pubAccounts.map((p) => `${p.userId}:${p.mtLogin}`));
  const pubNameMap = new Map(pubAccounts.map((p) => [`${p.userId}:${p.mtLogin}`, p.user.name?.trim() ?? ""]));

  // Filter hanya yang masih publish + ambil trading activity
  const activeFollows = follows.filter((f) => pubSet.has(`${f.publisherUserId}:${f.mtLogin}`));

  if (activeFollows.length === 0) {
    return NextResponse.json({ ok: true, feeds: [] });
  }

  const activities = await prisma.mtTradingActivity.findMany({
    where: {
      OR: activeFollows.map((f) => ({ userId: f.publisherUserId, mtLogin: f.mtLogin })),
    },
    select: {
      userId: true,
      mtLogin: true,
      positions: true,
      pendingOrders: true,
      recordedAt: true,
    },
  });

  const actMap = new Map(activities.map((a) => [`${a.userId}:${a.mtLogin}`, a]));

  // Bangun ETag dari semua recordedAt gabungan
  const etag =
    '"' +
    activeFollows
      .map((f) => actMap.get(`${f.publisherUserId}:${f.mtLogin}`)?.recordedAt.getTime() ?? 0)
      .join("-") +
    '"';

  const ifNoneMatch = req.headers.get("if-none-match") ?? "";
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "no-store" },
    });
  }

  const feeds = activeFollows.map((f) => {
    const key = `${f.publisherUserId}:${f.mtLogin}`;
    const row = actMap.get(key) ?? null;
    return {
      ownerId: f.publisherUserId,
      mtLogin: f.mtLogin,
      displayName: pubNameMap.get(key) ?? "",
      expiresAt: f.expiresAt?.toISOString() ?? null,
      activity: tradingActivityFromRow(row),
    };
  });

  return new Response(JSON.stringify({ ok: true, feeds }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": "no-store",
    },
  });
}
