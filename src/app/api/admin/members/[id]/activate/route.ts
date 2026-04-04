import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberStatus } from "@prisma/client";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, memberStatus: true } });
  if (!user) return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  if (user.memberStatus === MemberStatus.ACTIVE) return NextResponse.json({ ok: true, alreadyActive: true });

  await prisma.user.update({ where: { id: params.id }, data: { memberStatus: MemberStatus.ACTIVE } });
  return NextResponse.json({ ok: true });
}
