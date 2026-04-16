import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Admin: cabut lisensi indikator MT (key tidak lagi lolos verifikasi). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const licenseId = String(id ?? "").trim();
  if (!licenseId) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const row = await prisma.mtIndicatorLicense.findUnique({
    where: { id: licenseId },
    select: { id: true, revokedAt: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Lisensi tidak ditemukan" }, { status: 404 });
  }
  if (row.revokedAt) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  await prisma.mtIndicatorLicense.update({
    where: { id: licenseId },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
