import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  publisherUserId: z.string().min(1),
  mtLogin: z.string().min(1).max(32),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerUserId = session.user.id;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { publisherUserId, mtLogin } = parsed.data;
  if (publisherUserId === followerUserId) {
    return NextResponse.json({ error: "Tidak bisa mengikuti akun sendiri" }, { status: 400 });
  }

  const pub = await prisma.mtCommunityPublishedAccount.findUnique({
    where: { userId_mtLogin: { userId: publisherUserId, mtLogin } },
    select: { allowCopy: true },
  });
  if (!pub?.allowCopy) {
    return NextResponse.json({ error: "Akun tidak dipublikasikan di komunitas" }, { status: 400 });
  }

  try {
    await prisma.mtCommunityActivityWatch.create({
      data: { followerUserId, publisherUserId, mtLogin },
    });
    return NextResponse.json({ ok: true });
  } catch {
    const dup = await prisma.mtCommunityActivityWatch.findUnique({
      where: {
        followerUserId_publisherUserId_mtLogin: {
          followerUserId,
          publisherUserId,
          mtLogin,
        },
      },
    });
    if (dup) {
      return NextResponse.json({ error: "Anda sudah mengikuti aktivitas akun ini" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerUserId = session.user.id;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { publisherUserId, mtLogin } = parsed.data;

  try {
    await prisma.mtCommunityActivityWatch.delete({
      where: {
        followerUserId_publisherUserId_mtLogin: {
          followerUserId,
          publisherUserId,
          mtLogin,
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Belum mengikuti atau sudah dihapus" }, { status: 404 });
  }
}
