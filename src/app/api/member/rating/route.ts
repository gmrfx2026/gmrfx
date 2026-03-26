import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  memberId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { memberId, stars } = parsed.data;
  if (memberId === session.user.id) {
    return NextResponse.json({ error: "Tidak bisa rating diri sendiri" }, { status: 400 });
  }

  const member = await prisma.user.findFirst({
    where: { id: memberId, memberStatus: "ACTIVE", profileComplete: true },
    select: { id: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  }

  const statusCount = await prisma.statusEntry.count({
    where: { userId: memberId },
  });

  if (statusCount === 0) {
    return NextResponse.json({ error: "Member belum pernah menulis status" }, { status: 400 });
  }

  const existing = await prisma.memberRating.findFirst({
    where: { memberId, raterId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.memberRating.update({
      where: { id: existing.id },
      data: { stars },
    });
  } else {
    await prisma.memberRating.create({
      data: { memberId, raterId: session.user.id, stars },
    });
  }

  return NextResponse.json({ ok: true });
}

