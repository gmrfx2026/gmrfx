import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRegenciesFromPackage } from "@/lib/wilayahPackage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const provinceId = new URL(req.url).searchParams.get("provinceId");
  if (!provinceId) {
    return NextResponse.json({ error: "provinceId wajib" }, { status: 400 });
  }

  try {
    const rows = await prisma.indonesiaRegency.findMany({
      where: { provinceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    if (rows.length > 0) {
      return NextResponse.json({ items: rows, source: "db" as const });
    }
  } catch (e) {
    console.warn("wilayah/regencies: DB tidak dipakai, fallback paket.", e);
  }

  try {
    const items = getRegenciesFromPackage(provinceId);
    return NextResponse.json({ items, source: "package" as const });
  } catch (e) {
    console.error("wilayah/regencies: fallback gagal", e);
    return NextResponse.json(
      { items: [], error: "Gagal memuat kabupaten/kota." },
      { status: 503 }
    );
  }
}
