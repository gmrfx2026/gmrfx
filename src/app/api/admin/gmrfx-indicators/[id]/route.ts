import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGmrfxOfficialSellerId } from "@/lib/gmrfxOfficialSeller";
import { Decimal } from "@prisma/client/runtime/library";
import { unlink } from "fs/promises";
import {
  INDICATOR_MAX_BYTES,
  localIndicatorFileAbsolutePath,
  resolveIndicatorExt,
  storeIndicatorFile,
} from "@/lib/indicatorUpload";
import { parseMarketplacePlatform } from "@/lib/marketplacePlatform";
import { normalizeMarketplaceDescriptionHtml } from "@/lib/marketplaceDescription";
import { normalizeMtLicenseProductCode, parseMtLicenseValidityDays } from "@/lib/indicatorLicense";

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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const officialSellerId = await getGmrfxOfficialSellerId();
  if (!officialSellerId) {
    return NextResponse.json(
      { error: "Akun penjual resmi GMRFX belum dikonfigurasi (env / SystemSetting)." },
      { status: 503 }
    );
  }

  const existing = await prisma.sharedIndicator.findFirst({
    where: { id, isGmrfxOfficial: true, sellerId: officialSellerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Indikator GMRFX tidak ditemukan" }, { status: 404 });
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
  const description = normalizeMarketplaceDescriptionHtml(
    descriptionRaw == null ? "" : String(descriptionRaw)
  );
  if (description && description.length > 200_000) {
    return NextResponse.json({ error: "Deskripsi terlalu panjang" }, { status: 400 });
  }

  let priceIdr: Decimal;
  let platform: string;
  let published: boolean;
  let mtLicenseProductCode: string | null;
  let mtLicenseValidityDays: number | null;
  try {
    priceIdr = parsePriceIdr(form.get("priceIdr"));
    platform = parseMarketplacePlatform(form.get("platform"));
    published = parseBool(form.get("published"));
    const codeRaw = String(form.get("mtLicenseProductCode") ?? "").trim();
    const codeNorm = normalizeMtLicenseProductCode(codeRaw.length > 0 ? codeRaw : null);
    if (codeRaw.length > 0 && !codeNorm) {
      throw new Error("Kode lisensi MT tidak valid (huruf, angka, garis bawah; maks. 64)");
    }
    mtLicenseProductCode = codeNorm;
    if (mtLicenseProductCode) {
      const daysRaw = parseMtLicenseValidityDays(form.get("mtLicenseValidityDays"));
      mtLicenseValidityDays = daysRaw ?? 365;
    } else {
      mtLicenseValidityDays = null;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Data tidak valid";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (priceIdr.gt(0)) {
    const u = await prisma.user.findUnique({
      where: { id: officialSellerId },
      select: { walletAddress: true, memberStatus: true },
    });
    if (!u?.walletAddress) {
      return NextResponse.json(
        { error: "Akun penjual resmi GMRFX perlu alamat wallet untuk harga berbayar." },
        { status: 400 }
      );
    }
    if (u.memberStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Akun penjual resmi tidak aktif" }, { status: 403 });
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
      const stored = await storeIndicatorFile(officialSellerId, file, buf);
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
        mtLicenseProductCode,
        mtLicenseValidityDays,
        isGmrfxOfficial: true,
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
    console.error("admin gmrfx indicators PATCH", e);
    return NextResponse.json({ error: "Gagal memperbarui indikator" }, { status: 500 });
  }
}
