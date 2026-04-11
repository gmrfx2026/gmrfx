import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberFollowStatus } from "@prisma/client";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";

const MAX_RESULTS = 12;

/** Saran SeDulur (hanya yang diikuti, ACCEPTED) untuk penanda @ di komentar status. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const rows = await prisma.memberFollow.findMany({
    where: {
      followerId: session.user.id,
      status: MemberFollowStatus.ACCEPTED,
      following: {
        ...listablePublicMemberWhere,
        memberSlug: { not: null },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { memberSlug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
    select: {
      following: {
        select: { memberSlug: true, name: true, image: true },
      },
    },
    take: MAX_RESULTS,
    orderBy: { createdAt: "desc" },
  });

  const items = rows
    .map((r) => r.following)
    .filter((u): u is typeof u & { memberSlug: string } => Boolean(u.memberSlug));

  return NextResponse.json({ items });
}
