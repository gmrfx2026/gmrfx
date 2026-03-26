import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  followingId: z.string().min(1),
});

async function loadTarget(followingId: string) {
  return prisma.user.findFirst({
    where: {
      id: followingId,
      memberStatus: "ACTIVE",
      profileComplete: true,
    },
    select: { id: true, followApprovalMode: true, name: true, memberSlug: true },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { followingId } = parsed.data;
  if (followingId === session.user.id) {
    return NextResponse.json({ error: "Tidak bisa mengikuti diri sendiri" }, { status: 400 });
  }

  const target = await loadTarget(followingId);
  if (!target) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  const existing = await prisma.memberFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId,
      },
    },
    select: { id: true, status: true },
  });

  if (existing?.status === "ACCEPTED") {
    return NextResponse.json({ ok: true, state: "following" as const });
  }
  if (existing?.status === "PENDING") {
    return NextResponse.json({ ok: true, state: "pending" as const });
  }

  const wantsApproval = target.followApprovalMode === "APPROVAL_REQUIRED";
  const status = wantsApproval ? "PENDING" : "ACCEPTED";

  await prisma.memberFollow.create({
    data: {
      followerId: session.user.id,
      followingId,
      status,
    },
  });

  if (wantsApproval) {
    const follower = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const followerName = follower?.name ?? "Member";

    await prisma.notification.create({
      data: {
        userId: followingId,
        actorId: session.user.id,
        type: NotificationType.FOLLOW_REQUEST,
        title: "Permintaan mengikuti",
        body: `${followerName} ingin mengikuti Anda.`,
        linkUrl: "/profil?tab=notifications",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    state: wantsApproval ? ("pending" as const) : ("following" as const),
  });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const followingId = searchParams.get("followingId") ?? "";
  if (!followingId) {
    return NextResponse.json({ error: "followingId wajib" }, { status: 400 });
  }

  await prisma.memberFollow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId,
    },
  });

  return NextResponse.json({ ok: true });
}
