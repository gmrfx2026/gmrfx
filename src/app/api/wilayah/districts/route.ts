import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDistrictsFromPackage } from "@/lib/wilayahPackage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const regencyId = new URL(req.url).searchParams.get("regencyId");
  if (!regencyId) {
    return NextResponse.json({ error: "regencyId wajib" }, { status: 400 });
  }

  try {
    const rows = await prisma.indonesiaDistrict.findMany({
      where: { regencyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    if (rows.length > 0) {
      return NextResponse.json({ items: rows, source: "db" as const });
    }
  } catch (e) {
    console.warn("wilayah/districts: DB tidak dipakai, fallback paket.", e);
  }

  try {
    const items = getDistrictsFromPackage(regencyId);
    return NextResponse.json({ items, source: "package" as const });
  } catch (e) {
    console.error("wilayah/districts: fallback gagal", e);
    return NextResponse.json(
      { items: [], error: "Gagal memuat kecamatan." },
      { status: 503 }
    );
  }
}
