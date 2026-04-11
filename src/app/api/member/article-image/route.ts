import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ARTICLE_IMAGES_SUBDIR,
  ARTICLE_IMAGE_MAX_BYTES,
  fileExtForArticleType,
  sniffArticleImageType,
} from "@/lib/articleImagePolicy";
import { isVercelDeploy, resolvedBlobReadWriteToken } from "@/lib/uploadStorage";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function isUploadBlob(v: unknown): v is Blob {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Blob).arrayBuffer === "function" &&
    typeof (v as Blob).size === "number"
  );
}

export async function POST(req: Request) {
  const session = await auth();
  /** Sama seperti avatar / penawaran: cukup login. `profileComplete` hanya untuk kirim artikel ke admin. */
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!isUploadBlob(file)) {
    return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
  }
  if (file.size > ARTICLE_IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: "Maksimal 2,5 MB" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffArticleImageType(buf);
  if (!kind) {
    return NextResponse.json({ error: "Hanya gambar JPG, PNG, atau WebP yang valid" }, { status: 400 });
  }

  const ext = fileExtForArticleType(kind);
  const filename = `${randomUUID()}.${ext}`;
  const token = resolvedBlobReadWriteToken();

  if (token) {
    try {
      const blob = await put(`${ARTICLE_IMAGES_SUBDIR}/${filename}`, buf, {
        access: "public",
        contentType: CONTENT_TYPES[ext] ?? "image/jpeg",
        addRandomSuffix: false,
        token,
      });
      return NextResponse.json({ ok: true, url: blob.url });
    } catch (e) {
      console.error("article-image blob upload", e);
      return NextResponse.json(
        { error: "Gagal mengunggah gambar ke storage. Coba beberapa saat lagi." },
        { status: 502 },
      );
    }
  }

  if (isVercelDeploy()) {
    return NextResponse.json(
      { error: "Upload gambar memerlukan konfigurasi storage. Hubungi administrator." },
      { status: 503 },
    );
  }

  // Fallback: local disk (pengembangan lokal)
  try {
    const dir = path.join(process.cwd(), "public", "uploads", ARTICLE_IMAGES_SUBDIR);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
    return NextResponse.json({ ok: true, url: `/uploads/${ARTICLE_IMAGES_SUBDIR}/${filename}` });
  } catch (e) {
    console.error("article-image local write", e);
    return NextResponse.json({ error: "Gagal menyimpan gambar." }, { status: 503 });
  }
}
