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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.profileComplete) {
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
  const dir = path.join(process.cwd(), "public", "uploads", ARTICLE_IMAGES_SUBDIR);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  const url = `/uploads/${ARTICLE_IMAGES_SUBDIR}/${filename}`;
  return NextResponse.json({ ok: true, url });
}
