import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function communityAccountPath(publisherUserId: string, mtLogin: string): string {
  return `/profil/portfolio/community/account/${encodeURIComponent(publisherUserId)}/${encodeURIComponent(mtLogin)}`;
}

/** Kirim notifikasi ke member yang menekan "Ikuti" pada akun komunitas ini. */
export async function notifyCommunityMtActivityWatchers(params: {
  publisherUserId: string;
  mtLogin: string;
  displayName: string;
  opened: { symbol: string }[];
  closed: { symbol: string }[];
}): Promise<void> {
  const { opened, closed } = params;
  if (opened.length === 0 && closed.length === 0) return;

  const watchers = await prisma.mtCommunityActivityWatch.findMany({
    where: { publisherUserId: params.publisherUserId, mtLogin: params.mtLogin },
    select: { followerUserId: true },
  });
  if (watchers.length === 0) return;

  const linkUrl = communityAccountPath(params.publisherUserId, params.mtLogin);
  const label = params.displayName.trim() || "Akun komunitas";

  type Row = {
    userId: string;
    actorId: string;
    type: NotificationType;
    title: string;
    body: string;
    linkUrl: string;
  };

  const rows: Row[] = [];

  for (const o of opened) {
    const sym = o.symbol || "(internal)";
    rows.push(
      ...watchers.map((w) => ({
        userId: w.followerUserId,
        actorId: params.publisherUserId,
        type: NotificationType.COMMUNITY_MT_TRADE_ALERT,
        title: `${label}: posisi baru`,
        body: `Buka ${sym}`,
        linkUrl,
      }))
    );
  }
  for (const c of closed) {
    const sym = c.symbol || "(internal)";
    rows.push(
      ...watchers.map((w) => ({
        userId: w.followerUserId,
        actorId: params.publisherUserId,
        type: NotificationType.COMMUNITY_MT_TRADE_ALERT,
        title: `${label}: posisi ditutup`,
        body: `Tutup ${sym}`,
        linkUrl,
      }))
    );
  }

  if (rows.length === 0) return;
  await prisma.notification.createMany({ data: rows });
}

/** Nama tampilan untuk judul notifikasi: nama akun terminal jika ada. */
export async function resolveCommunityMtDisplayName(
  publisherUserId: string,
  mtLogin: string
): Promise<string> {
  const snap = await prisma.mtAccountSnapshot.findFirst({
    where: { userId: publisherUserId, mtLogin },
    orderBy: { recordedAt: "desc" },
    select: { tradeAccountName: true },
  });
  const fromSnap = snap?.tradeAccountName?.trim();
  if (fromSnap) return fromSnap;
  const u = await prisma.user.findUnique({
    where: { id: publisherUserId },
    select: { name: true },
  });
  return u?.name?.trim() ?? "";
}
