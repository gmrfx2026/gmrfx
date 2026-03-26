import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  followingId: z.string().min(1),
});

async function assertTargetMember(followingId: string) {
  const u = await prisma.user.findFirst({
    where: {
      id: followingId,
      memberStatus: "ACTIVE",
      profileComplete: true,
    },
    select: { id: true },
  });
  return u;
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

  const target = await assertTargetMember(followingId);
  if (!target) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  await prisma.memberFollow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId,
      },
    },
    create: {
      followerId: session.user.id,
      followingId,
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
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
