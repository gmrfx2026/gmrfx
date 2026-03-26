import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Permintaan mengikuti yang menunggu persetujuan Anda (Anda = following). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.memberFollow.findMany({
    where: {
      followingId: session.user.id,
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    include: {
      follower: {
        select: { id: true, name: true, image: true, memberSlug: true },
      },
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      followerId: r.followerId,
      createdAt: r.createdAt.toISOString(),
      follower: {
        name: r.follower.name ?? "Member",
        image: r.follower.image,
        memberSlug: r.follower.memberSlug,
      },
    })),
  });
}
