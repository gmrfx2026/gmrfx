import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { getMemberPublicPath } from "@/lib/memberNotifications";
import { z } from "zod";

const bodySchema = z.object({
  followerId: z.string().min(1),
  accept: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { followerId, accept } = parsed.data;
  const ownerId = session.user.id;
  if (followerId === ownerId) {
    return NextResponse.json({ error: "Tidak valid" }, { status: 400 });
  }

  const row = await prisma.memberFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: ownerId,
      },
    },
    select: { id: true, status: true },
  });

  if (!row || row.status !== "PENDING") {
    return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
  }

  if (!accept) {
    await prisma.memberFollow.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true, state: "rejected" as const });
  }

  await prisma.memberFollow.update({
    where: { id: row.id },
    data: { status: "ACCEPTED" },
  });

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { name: true },
  });
  const ownerName = owner?.name ?? "Member";

  const profileLink = (await getMemberPublicPath(ownerId)) ?? "/profil";

  await prisma.notification.create({
    data: {
      userId: followerId,
      actorId: ownerId,
      type: NotificationType.FOLLOW_ACCEPTED,
      title: "Permintaan disetujui",
      body: `${ownerName} menyetujui Anda untuk mengikuti.`,
      linkUrl: profileLink,
    },
  });

  return NextResponse.json({ ok: true, state: "accepted" as const });
}
