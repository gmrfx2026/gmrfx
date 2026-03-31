import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/sendTransactionalEmail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const h = req.headers.get("authorization");
  const bearer = h?.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const x = req.headers.get("x-cron-secret")?.trim() ?? "";
  return bearer === secret || x === secret;
}

function siteBaseUrl(): string {
  const u = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (!u) return "https://gmrfx.app";
  return u.startsWith("http") ? u : `https://${u}`;
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const [expiredCopies, expiredWatches] = await Promise.all([
    prisma.mtCopyFollow.findMany({
      where: { expiresAt: { not: null, lt: now } },
      select: {
        id: true,
        mtLogin: true,
        followerUserId: true,
        publisherUserId: true,
        followerUser: { select: { email: true, name: true } },
        publisherUser: { select: { name: true } },
      },
    }),
    prisma.mtCommunityActivityWatch.findMany({
      where: { expiresAt: { not: null, lt: now } },
      select: {
        id: true,
        mtLogin: true,
        followerUserId: true,
        publisherUserId: true,
        follower: { select: { email: true, name: true } },
        publisher: { select: { name: true } },
      },
    }),
  ]);

  let copyProcessed = 0;
  let watchProcessed = 0;
  const base = siteBaseUrl();
  const accountsUrl = `${base}/profil/portfolio/community/accounts`;

  for (const row of expiredCopies) {
    const pubName = row.publisherUser.name?.trim() || "Member";
    const title = "Langganan Copy trade berakhir";
    const body = `Masa langganan Copy untuk akun MetaTrader ${row.mtLogin} (${pubName}) telah habis (periode ~30 hari). Anda dapat berlangganan lagi dari halaman Komunitas jika pemilik masih membuka layanan.`;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            userId: row.followerUserId,
            actorId: row.publisherUserId,
            type: NotificationType.COMMUNITY_COPY_SUB_EXPIRED,
            title,
            body,
            linkUrl: "/profil/portfolio/community/accounts",
          },
        });
        await tx.mtCopyFollow.delete({ where: { id: row.id } });
      });
      copyProcessed++;
      void sendTransactionalEmail({
        to: row.followerUser.email,
        subject: "GMR FX — Langganan Copy trade berakhir",
        text: `${body}\n\n${accountsUrl}`,
      });
    } catch (e) {
      console.error("cron community-subscriptions copy", row.id, e);
    }
  }

  for (const row of expiredWatches) {
    const pubName = row.publisher.name?.trim() || "Member";
    const title = "Langganan alert Ikuti berakhir";
    const body = `Masa langganan notifikasi posisi (Ikuti) untuk akun MetaTrader ${row.mtLogin} (${pubName}) telah habis (periode ~30 hari). Anda dapat berlangganan lagi dari halaman Komunitas jika pemilik menetapkan alert berbayar.`;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            userId: row.followerUserId,
            actorId: row.publisherUserId,
            type: NotificationType.COMMUNITY_WATCH_SUB_EXPIRED,
            title,
            body,
            linkUrl: "/profil/portfolio/community/accounts",
          },
        });
        await tx.mtCommunityActivityWatch.delete({ where: { id: row.id } });
      });
      watchProcessed++;
      void sendTransactionalEmail({
        to: row.follower.email,
        subject: "GMR FX — Langganan alert Ikuti berakhir",
        text: `${body}\n\n${accountsUrl}`,
      });
    } catch (e) {
      console.error("cron community-subscriptions watch", row.id, e);
    }
  }

  return NextResponse.json({
    ok: true,
    at: now.toISOString(),
    expiredCopyRows: expiredCopies.length,
    expiredWatchRows: expiredWatches.length,
    copyProcessed,
    watchProcessed,
  });
}
