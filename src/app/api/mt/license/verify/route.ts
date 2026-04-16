import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashIndicatorLicenseKey,
  normalizeLicenseEmail,
  normalizeMtLicenseProductCode,
} from "@/lib/indicatorLicense";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productCode: z.string().min(1).max(64),
  email: z.string().min(3).max(320),
  licenseKey: z.string().min(16).max(256),
});

/**
 * Verifikasi lisensi indikator MT (dipanggil dari indikator via WebRequest).
 * Body JSON: { productCode, email, licenseKey }
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Parameter tidak valid" }, { status: 400 });
  }

  const productCode = normalizeMtLicenseProductCode(parsed.data.productCode);
  if (!productCode) {
    return NextResponse.json({ ok: false, error: "productCode tidak valid" }, { status: 400 });
  }

  const emailNorm = normalizeLicenseEmail(parsed.data.email);
  if (!emailNorm.includes("@")) {
    return NextResponse.json({ ok: false, error: "email tidak valid" }, { status: 400 });
  }

  const licenseKey = String(parsed.data.licenseKey).trim();
  const licenseKeyHash = hashIndicatorLicenseKey(licenseKey);

  const row = await prisma.mtIndicatorLicense.findUnique({
    where: { licenseKeyHash },
    include: {
      user: { select: { email: true, memberStatus: true } },
      purchase: { select: { revokedAt: true } },
    },
  });

  if (!row) {
    return NextResponse.json({ ok: false, error: "Lisensi tidak dikenal" }, { status: 404 });
  }

  if (row.revokedAt) {
    return NextResponse.json({ ok: false, error: "Lisensi dicabut" }, { status: 403 });
  }

  if (row.purchase.revokedAt) {
    return NextResponse.json({ ok: false, error: "Pembelian dibatalkan" }, { status: 403 });
  }

  if (row.productCode !== productCode) {
    return NextResponse.json({ ok: false, error: "Produk tidak cocok" }, { status: 403 });
  }

  if (row.user.memberStatus !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Akun tidak aktif" }, { status: 403 });
  }

  if (normalizeLicenseEmail(row.user.email) !== emailNorm) {
    return NextResponse.json({ ok: false, error: "Email tidak cocok dengan akun terdaftar" }, { status: 403 });
  }

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    return NextResponse.json(
      {
        ok: false,
        error: "Masa berlaku lisensi habis",
        validUntil: row.expiresAt.toISOString(),
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    productCode: row.productCode,
    validUntil: row.expiresAt.toISOString(),
  });
}
