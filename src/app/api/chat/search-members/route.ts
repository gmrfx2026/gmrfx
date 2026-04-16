import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ peers: [] });
  }

  const userId = session.user.id;

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        { memberStatus: "ACTIVE" },
        { profileComplete: true },
        {
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { memberSlug: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        },
      ],
    },
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true, email: true, image: true, memberSlug: true },
  });

  const peers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ? maskEmail(u.email) : null,
    image: u.image ? resolvePublicDisplayUrl(u.image) ?? u.image : null,
    memberSlug: u.memberSlug,
    online: false,
  }));

  return NextResponse.json({ peers });
}
