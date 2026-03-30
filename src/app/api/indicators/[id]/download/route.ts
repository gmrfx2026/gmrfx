import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { createReadStream } from "fs";
import { Readable } from "node:stream";
import { localIndicatorFileAbsolutePath } from "@/lib/indicatorUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asciiFilename(name: string): string {
  const s = name.replace(/[^\x20-\x7E]/g, "_").slice(0, 180) || "download";
  return s;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: indicatorId } = await ctx.params;
  if (!indicatorId) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const ind = await prisma.sharedIndicator.findUnique({
    where: { id: indicatorId },
  });

  if (!ind || !ind.published) {
    return NextResponse.json({ error: "Indikator tidak ditemukan" }, { status: 404 });
  }

  const price = new Decimal(ind.priceIdr.toString());
  let allowed = ind.sellerId === userId || price.lte(0);

  if (!allowed) {
    const purchase = await prisma.indicatorPurchase.findUnique({
      where: {
        indicatorId_buyerId: { indicatorId, buyerId: userId },
      },
    });
    allowed = Boolean(purchase);
  }

  if (!allowed) {
    return NextResponse.json({ error: "Beli indikator ini terlebih dahulu" }, { status: 403 });
  }

  const disp = `attachment; filename="${asciiFilename(ind.fileName)}"; filename*=UTF-8''${encodeURIComponent(ind.fileName)}`;

  const localPath = localIndicatorFileAbsolutePath(ind.fileUrl);
  if (localPath) {
    try {
      const nodeStream = createReadStream(localPath);
      const web = Readable.toWeb(nodeStream) as ReadableStream;
      return new NextResponse(web, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": disp,
        },
      });
    } catch (e) {
      console.error("indicator download local", e);
      return NextResponse.json({ error: "File tidak dapat dibaca" }, { status: 502 });
    }
  }

  try {
    const r = await fetch(ind.fileUrl);
    if (!r.ok) {
      return NextResponse.json({ error: "Gagal mengambil file dari penyimpanan" }, { status: 502 });
    }
    const body = r.body;
    if (!body) {
      return NextResponse.json({ error: "Respons penyimpanan kosong" }, { status: 502 });
    }
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": disp,
      },
    });
  } catch (e) {
    console.error("indicator download fetch", e);
    return NextResponse.json({ error: "Gagal mengunduh file" }, { status: 502 });
  }
}
