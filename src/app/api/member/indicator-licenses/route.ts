import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daftar lisensi MT milik pembeli (untuk profil / salin key). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.mtIndicatorLicense.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      productCode: true,
      licenseKeyHint: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      emailNormalized: true,
      indicator: { select: { title: true, slug: true } },
      purchase: { select: { revokedAt: true } },
    },
  });

  const now = Date.now();
  return NextResponse.json({
    items: rows.map((r) => {
      const purchaseOk = r.purchase.revokedAt == null;
      const licenseOk = r.revokedAt == null;
      const notExpired = r.expiresAt.getTime() > now;
      return {
        id: r.id,
        productCode: r.productCode,
        hint: r.licenseKeyHint,
        expiresAt: r.expiresAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
        emailRegistered: r.emailNormalized,
        indicatorTitle: r.indicator.title,
        indicatorSlug: r.indicator.slug,
        active: purchaseOk && licenseOk && notExpired,
      };
    }),
  });
}
