import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateMt5ApiToken } from "@/lib/mt5Token";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.mtLinkToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tokenHint: true,
      label: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({ items: rows });
}

const postSchema = z.object({
  label: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { plain, hash, hint } = generateMt5ApiToken();
  const row = await prisma.mtLinkToken.create({
    data: {
      userId: session.user.id,
      tokenHash: hash,
      tokenHint: hint,
      label: parsed.data.label?.trim() || null,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    id: row.id,
    token: plain,
    hint,
    createdAt: row.createdAt.toISOString(),
    message: "Simpan token ini sekarang — tidak ditampilkan lagi.",
  });
}

const delSchema = z.object({ id: z.string().min(1) });

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("id");
  let id: string | null = q;
  if (!id) {
    try {
      const j = await req.json();
      const p = delSchema.safeParse(j);
      if (!p.success) return NextResponse.json({ error: "id wajib" }, { status: 400 });
      id = p.data.id;
    } catch {
      return NextResponse.json({ error: "id wajib (query atau JSON)" }, { status: 400 });
    }
  }

  if (!id) {
    return NextResponse.json({ error: "id wajib" }, { status: 400 });
  }

  const r = await prisma.mtLinkToken.updateMany({
    where: { id, userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (r.count === 0) {
    return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
