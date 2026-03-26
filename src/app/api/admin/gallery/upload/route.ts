import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  fileExtForGalleryType,
  GALLERY_IMAGE_MAX_BYTES,
  GALLERY_IMAGES_SUBDIR,
  sniffGalleryImageType,
} from "@/lib/galleryImagePolicy";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
  }
  if (file.size > GALLERY_IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: "Maksimal 2,5 MB" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffGalleryImageType(buf);
  if (!kind) {
    return NextResponse.json({ error: "Hanya JPG, PNG, atau WebP yang valid" }, { status: 400 });
  }

  const ext = fileExtForGalleryType(kind);
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", GALLERY_IMAGES_SUBDIR);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  return NextResponse.json({ ok: true, url: `/uploads/${GALLERY_IMAGES_SUBDIR}/${filename}` });
}
