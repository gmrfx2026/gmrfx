import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { unlinkGalleryUploadFile } from "@/lib/galleryUploadCleanup";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const type = String(body.type ?? "");

  if (type === "category") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Nama wajib" }, { status: 400 });
    let slug = slugify(name);
    const exists = await prisma.galleryCategory.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-x`;
    await prisma.galleryCategory.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description).slice(0, 500) : null,
      },
    });
    return NextResponse.json({ ok: true, slug });
  }

  if (type === "image") {
    const categoryId = String(body.categoryId ?? "");
    const imageUrl = String(body.imageUrl ?? "").trim();
    const caption = body.caption ? String(body.caption).slice(0, 500) : null;
    if (!categoryId || !imageUrl) {
      return NextResponse.json({ error: "Kategori & URL gambar wajib" }, { status: 400 });
    }
    await prisma.galleryImage.create({
      data: { categoryId, imageUrl, caption },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "type tidak valid" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  const categoryId = String(body.categoryId ?? "");
  const imageUrl = String(body.imageUrl ?? "").trim();
  const caption = body.caption ? String(body.caption).slice(0, 500) : null;
  const sortOrderRaw = body.sortOrder;
  const sortOrder =
    sortOrderRaw !== undefined && sortOrderRaw !== null && sortOrderRaw !== ""
      ? Math.trunc(Number(sortOrderRaw))
      : undefined;
  if (sortOrder !== undefined && (!Number.isFinite(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647)) {
    return NextResponse.json({ error: "Urutan tidak valid" }, { status: 400 });
  }

  if (!id || !categoryId || !imageUrl) {
    return NextResponse.json({ error: "id, kategori, dan URL gambar wajib" }, { status: 400 });
  }

  try {
    const prev = await prisma.galleryImage.findUnique({ where: { id }, select: { imageUrl: true } });
    await prisma.galleryImage.update({
      where: { id },
      data: {
        categoryId,
        imageUrl,
        caption,
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    });
    if (prev && prev.imageUrl !== imageUrl) {
      await unlinkGalleryUploadFile(prev.imageUrl);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mengedit galeri" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") ?? "");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  try {
    const row = await prisma.galleryImage.findUnique({ where: { id }, select: { imageUrl: true } });
    await prisma.galleryImage.delete({ where: { id } });
    if (row) await unlinkGalleryUploadFile(row.imageUrl);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus galeri" }, { status: 400 });
  }
}
