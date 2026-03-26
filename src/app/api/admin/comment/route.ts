import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  const hidden = Boolean(body.hidden);
  if (!id) {
    return NextResponse.json({ error: "id wajib" }, { status: 400 });
  }

  try {
    await prisma.comment.update({
      where: { id },
      data: { hidden },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Komentar tidak ditemukan" }, { status: 404 });
  }
}
