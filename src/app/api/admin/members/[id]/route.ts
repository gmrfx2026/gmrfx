import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { memberStatus: true, email: true } });
  if (!user) return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });

  if (user.memberStatus !== "PENDING") {
    return NextResponse.json({ error: "Hanya akun PENDING yang bisa dihapus dari sini" }, { status: 409 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
