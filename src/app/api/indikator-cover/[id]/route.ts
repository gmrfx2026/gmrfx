import { NextResponse } from "next/server";
import { getIndicatorCoverSvg, isIndicatorCoverId } from "@/lib/marketplaceIndicatorCoverSvgs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = String(raw ?? "").trim();
  if (!isIndicatorCoverId(id)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const svg = getIndicatorCoverSvg(id);
  if (!svg) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
