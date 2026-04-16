import { NextResponse } from "next/server";
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

  const onlineWindowMinutes = 5;
  const onlineCutoff = new Date(Date.now() - onlineWindowMinutes * 60 * 1000);
  const userId = session.user.id;

  const [privateOnlineRows, publicOnlineRows] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        createdAt: { gte: onlineCutoff },
        senderId: { not: userId },
      },
      select: { senderId: true },
      distinct: ["senderId"],
      take: 100,
    }),
    prisma.publicChatMessage.findMany({
      where: {
        createdAt: { gte: onlineCutoff },
        senderId: { not: userId },
      },
      select: { senderId: true },
      distinct: ["senderId"],
      take: 100,
    }),
  ]);

  const onlinePeerIds = [...privateOnlineRows, ...publicOnlineRows].map((r) => r.senderId);
  const onlinePeerIdSet = new Set(onlinePeerIds);

  const candidateIds = new Set<string>(onlinePeerIds);
  if (requestedPeerId && requestedPeerId !== userId) candidateIds.add(requestedPeerId);
  candidateIds.delete(userId);

  const candidateArr = Array.from(candidateIds);

  const baseWhere = {
    profileComplete: true,
    memberStatus: "ACTIVE" as const,
  };

  const users =
    candidateArr.length > 0
      ? await prisma.user.findMany({
          where: { ...baseWhere, id: { in: candidateArr } },
          orderBy: { name: "asc" },
          take: 40,
          select: { id: true, name: true, email: true, image: true },
        })
      : await prisma.user.findMany({
          where: { ...baseWhere, id: { not: userId } },
          orderBy: { name: "asc" },
          take: 40,
          select: { id: true, name: true, email: true, image: true },
        });

  const peers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ? maskEmail(u.email) : null,
    image: u.image ? resolvePublicDisplayUrl(u.image) ?? u.image : null,
    online: onlinePeerIdSet.has(u.id),
  }));

  return NextResponse.json({ peers });
}
