import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = await req.json() as { action: "publish" | "unpublish" | "delete" };

  if (action === "delete") {
    await prisma.sharedIndicator.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  const published = action === "publish";
  await prisma.sharedIndicator.update({ where: { id: params.id }, data: { published } });
  return NextResponse.json({ ok: true, published });
}
