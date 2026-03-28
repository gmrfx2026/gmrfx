import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvincesFromPackage } from "@/lib/wilayahPackage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await prisma.indonesiaProvince.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    if (rows.length > 0) {
      return NextResponse.json({ items: rows, source: "db" as const });
    }
  } catch (e) {
    console.warn("wilayah/provinces: DB tidak dipakai, fallback paket.", e);
  }

  try {
    const items = getProvincesFromPackage();
    return NextResponse.json({ items, source: "package" as const });
  } catch (e) {
    console.error("wilayah/provinces: fallback gagal", e);
    return NextResponse.json(
      { items: [], error: "Gagal memuat provinsi." },
      { status: 503 }
    );
  }
}
