import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isUserProfileComplete } from "@/lib/profileComplete";
import {
  ARTICLE_IMAGES_SUBDIR,
  ARTICLE_IMAGE_MAX_BYTES,
  fileExtForArticleType,
  sniffArticleImageType,
} from "@/lib/articleImagePolicy";

export const runtime = "nodejs";

function blobRwToken(): string | undefined {
  const key = ["BLOB", "READ", "WRITE", "TOKEN"].join("_");
  const v = process.env[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isUserProfileComplete(session.user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
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
  const token = blobRwToken();

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

  if (isVercel()) {
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
