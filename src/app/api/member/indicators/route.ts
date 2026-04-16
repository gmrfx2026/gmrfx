import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { buildIndicatorSlugBase, uniqueIndicatorSlug } from "@/lib/indicatorSlug";
import { INDICATOR_MAX_BYTES, resolveIndicatorExt, storeIndicatorFile } from "@/lib/indicatorUpload";
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

function parsePlatform(v: FormDataEntryValue | null): string {
  const s = (v == null ? "mt5" : String(v)).trim().toLowerCase();
  if (s === "mt4" || s === "mt5") return s;
  throw new Error('Platform harus "mt4" atau "mt5"');
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.sharedIndicator.findMany({
    where: { sellerId: session.user.id, isGmrfxOfficial: false },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      priceIdr: true,
      fileName: true,
      platform: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      mtLicenseProductCode: true,
      mtLicenseValidityDays: true,
      _count: { select: { purchases: true } },
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      priceIdr: Number(r.priceIdr),
      purchaseCount: r._count.purchases,
      _count: undefined,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File wajib diunggah" }, { status: 400 });
  }

  if (!resolveIndicatorExt(file)) {
    return NextResponse.json(
      { error: "Format file: .zip, .ex4, .ex5, .mq4, atau .mq5" },
      { status: 400 }
    );
  }

  if (file.size > INDICATOR_MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 20 MB" }, { status: 400 });
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
      where: { id: userId },
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

  const buf = Buffer.from(await file.arrayBuffer());

  let fileUrl: string;
  let fileName: string;
  try {
    const stored = await storeIndicatorFile(userId, file, buf);
    fileUrl = stored.fileUrl;
    fileName = stored.fileName;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menyimpan file";
    const status = msg.includes("BLOB") || msg.includes("Vercel") ? 503 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const base = buildIndicatorSlugBase(title);
      const slug = await uniqueIndicatorSlug(tx, base);
      return tx.sharedIndicator.create({
        data: {
          sellerId: userId,
          title,
          slug,
          description,
          priceIdr,
          fileUrl,
          fileName,
          platform,
          published,
          isGmrfxOfficial: false,
          mtLicenseProductCode,
          mtLicenseValidityDays,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          priceIdr: true,
          published: true,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      indicator: {
        ...row,
        priceIdr: Number(row.priceIdr),
      },
    });
  } catch (e) {
    console.error("member indicators POST", e);
    return NextResponse.json({ error: "Gagal menyimpan indikator" }, { status: 500 });
  }
}
