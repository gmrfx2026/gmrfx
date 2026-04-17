import { NextResponse } from "next/server";
import { MemberFollowStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/lib/memberEmailDisplay";
import { resolvePublicDisplayUrl } from "@/lib/publicUploadUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedPeerId = url.searchParams.get("peerId");

  /**
   * Online = ping aktivitas (`memberLastSeenAt`) dalam 3 menit terakhir. Ping client tiap 90 detik +
   * saat tab visible; buffer 3 menit aman terhadap jitter jaringan.
   */
  const onlineCutoff = new Date(Date.now() - 3 * 60 * 1000);
  const userId = session.user.id;

  /** Hanya member yang terhubung follow ACCEPTED (saya mengikuti atau mengikuti saya). */
  const followRows = await prisma.memberFollow.findMany({
    where: {
      status: MemberFollowStatus.ACCEPTED,
      OR: [{ followerId: userId }, { followingId: userId }],
    },
    select: { followerId: true, followingId: true },
  });

  const connectedPeerIds = new Set<string>();
  for (const row of followRows) {
    const other = row.followerId === userId ? row.followingId : row.followerId;
    if (other !== userId) connectedPeerIds.add(other);
  }

  if (requestedPeerId && requestedPeerId !== userId) {
    connectedPeerIds.add(requestedPeerId);
  }

  const candidateArr = Array.from(connectedPeerIds);

  const baseWhere = {
    profileComplete: true,
    memberStatus: "ACTIVE" as const,
  };

  const users =
    candidateArr.length > 0
      ? await prisma.user.findMany({
          where: { ...baseWhere, id: { in: candidateArr } },
          orderBy: { name: "asc" },
          take: 80,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            memberSlug: true,
            memberLastSeenAt: true,
          },
        })
      : [];

  const peers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ? maskEmail(u.email) : null,
    image: u.image ? resolvePublicDisplayUrl(u.image) ?? u.image : null,
    memberSlug: u.memberSlug,
    online: u.memberLastSeenAt != null && u.memberLastSeenAt >= onlineCutoff,
  }));

  return NextResponse.json({ peers });
}
