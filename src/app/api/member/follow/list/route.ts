import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";
import { z } from "zod";

const PAGE_SIZE = 35;

const querySchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["followers", "following"]),
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
});

/** Profil publik: hanya member aktif + profil lengkap. Pemilik bisa lihat daftar sendiri walau profil belum lengkap. */
async function resolveListTarget(userId: string, viewerId: string | null) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { id: true, memberStatus: true, profileComplete: true },
  });
  if (!user || user.memberStatus !== "ACTIVE") return null;
  const isSelf = viewerId === userId;
  if (!user.profileComplete && !isSelf) return null;
  return user;
}

export async function GET(req: Request) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId") ?? "",
    type: searchParams.get("type") ?? "",
    page: searchParams.get("page") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
  }
  const { userId, type, page } = parsed.data;

  const target = await resolveListTarget(userId, viewerId);
  if (!target) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  const skip = (page - 1) * PAGE_SIZE;

  if (type === "followers") {
    const where = {
      followingId: userId,
      status: "ACCEPTED" as const,
      follower: listablePublicMemberWhere,
    };
    const [total, rows] = await Promise.all([
      prisma.memberFollow.count({ where }),
      prisma.memberFollow.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        select: {
          follower: {
            select: { id: true, name: true, image: true, memberSlug: true },
          },
        },
      }),
    ]);
    const items = rows.map((r) => ({
      id: r.follower.id,
      name: r.follower.name,
      image: r.follower.image,
      memberSlug: r.follower.memberSlug,
    }));
    return NextResponse.json({
      items,
      page,
      pageSize: PAGE_SIZE,
      total,
      hasMore: skip + items.length < total,
    });
  }

  const where = {
    followerId: userId,
    status: "ACCEPTED" as const,
    following: listablePublicMemberWhere,
  };
  const [total, rows] = await Promise.all([
    prisma.memberFollow.count({ where }),
    prisma.memberFollow.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        following: {
          select: { id: true, name: true, image: true, memberSlug: true },
        },
      },
    }),
  ]);
  const items = rows.map((r) => ({
    id: r.following.id,
    name: r.following.name,
    image: r.following.image,
    memberSlug: r.following.memberSlug,
  }));
  return NextResponse.json({
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: skip + items.length < total,
  });
}
