import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { unlink } from "fs/promises";
import { INDICATOR_MAX_BYTES, localIndicatorFileAbsolutePath, resolveIndicatorExt, storeIndicatorFile } from "@/lib/indicatorUpload";
import { parseMarketplacePlatform } from "@/lib/marketplacePlatform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBool(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "on" || s === "yes";
}

function parsePriceIdr(v: FormDataEntryValue | null): Decimal {
  const raw = v == null ? "0" : String(v).trim().replace(/,/g, ".");
  if (raw === "") return new Decimal(0);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999) {
    throw new Error("Harga IDR tidak valid (0–999.999.999)");
  }
  return new Decimal(Math.round(n * 100) / 100);
}

function parsePlatform(v: FormDataEntryValue | null): string {
  const s = (v == null ? "mt5" : String(v)).trim().toLowerCase();
  if (s === "mt4" || s === "mt5") return s;
  throw new Error('Platform harus "mt4" atau "mt5"');
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const existing = await prisma.sharedIndicator.findFirst({
    where: { id, sellerId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Indikator tidak ditemukan" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  if (title.length < 3 || title.length > 200) {
    return NextResponse.json({ error: "Judul 3–200 karakter" }, { status: 400 });
  }

  const descriptionRaw = form.get("description");
  const description =
    descriptionRaw == null ? null : String(descriptionRaw).trim().slice(0, 8000) || null;

  let priceIdr: Decimal;
  let platform: string;
  let published: boolean;
  try {
    priceIdr = parsePriceIdr(form.get("priceIdr"));
    platform = parseMarketplacePlatform(form.get("platform"));
    published = parseBool(form.get("published"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Data tidak valid";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (priceIdr.gt(0)) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletAddress: true, memberStatus: true },
    });
    if (!u?.walletAddress) {
      return NextResponse.json(
        { error: "Lengkapi alamat wallet di profil untuk menjual indikator berbayar" },
        { status: 400 }
      );
    }
    if (u.memberStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
    }
  }

  const file = form.get("file");
  let nextFileUrl = existing.fileUrl;
  let nextFileName = existing.fileName;

  if (file && file instanceof File && file.size > 0) {
    if (!resolveIndicatorExt(file)) {
      return NextResponse.json(
        { error: "Format file: .zip, .ex4, .ex5, .mq4, atau .mq5" },
        { status: 400 }
      );
    }
    if (file.size > INDICATOR_MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 20 MB" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    try {
      const stored = await storeIndicatorFile(session.user.id, file, buf);
      nextFileUrl = stored.fileUrl;
      nextFileName = stored.fileName;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan file";
      const status = msg.includes("BLOB") || msg.includes("Vercel") ? 503 : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    const oldLocal = localIndicatorFileAbsolutePath(existing.fileUrl);
    if (oldLocal) {
      try {
        await unlink(oldLocal);
      } catch {
        /* ignore */
      }
    }
  }

  try {
    const row = await prisma.sharedIndicator.update({
      where: { id },
      data: {
        title,
        description,
        priceIdr,
        platform,
        published,
        fileUrl: nextFileUrl,
        fileName: nextFileName,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        priceIdr: true,
        published: true,
        fileName: true,
      },
    });

    return NextResponse.json({
      ok: true,
      indicator: { ...row, priceIdr: Number(row.priceIdr) },
    });
  } catch (e) {
    console.error("member indicators PATCH", e);
    return NextResponse.json({ error: "Gagal memperbarui indikator" }, { status: 500 });
  }
}
