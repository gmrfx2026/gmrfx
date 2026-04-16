import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptMtLinkTokenPlain } from "@/lib/mtLinkTokenCrypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tampilkan key lisensi plain (hanya pemilik sesi login). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const row = await prisma.mtIndicatorLicense.findFirst({
    where: { id, userId: session.user.id },
    select: {
      licenseKeyCipher: true,
      revokedAt: true,
      expiresAt: true,
      purchase: { select: { revokedAt: true } },
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Lisensi tidak ditemukan" }, { status: 404 });
  }

  if (row.revokedAt || row.purchase.revokedAt) {
    return NextResponse.json({ error: "Lisensi tidak berlaku" }, { status: 403 });
  }

  try {
    const licenseKey = decryptMtLinkTokenPlain(row.licenseKeyCipher);
    return NextResponse.json({
      ok: true,
      licenseKey,
      validUntil: row.expiresAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Tidak dapat membaca key" }, { status: 500 });
  }
}
