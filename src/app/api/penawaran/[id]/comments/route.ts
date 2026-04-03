import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/penawaran/[id]/comments — ambil komentar (hanya requester/winner/admin)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id }, select: { requesterId: true, winnerId: true } });
  if (!job) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const isAllowed = session.user.role === "ADMIN" || session.user.id === job.requesterId || session.user.id === job.winnerId;
  if (!isAllowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comments = await prisma.jobComment.findMany({
    where: { jobId: params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ comments });
}

// POST /api/penawaran/[id]/comments — kirim komentar
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id }, select: { requesterId: true, winnerId: true, status: true } });
  if (!job) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const isAllowed = session.user.role === "ADMIN" || userId === job.requesterId || userId === job.winnerId;
  if (!isAllowed) return NextResponse.json({ error: "Hanya pemberi kerja dan pemenang yang bisa berkomentar" }, { status: 403 });
  if (["COMPLETED", "CANCELLED"].includes(job.status)) return NextResponse.json({ error: "Pekerjaan sudah selesai/dibatalkan" }, { status: 409 });

  let body: { content?: string };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }

  const content = (body.content ?? "").trim();
  if (!content || content.length < 1) return NextResponse.json({ error: "Komentar tidak boleh kosong" }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Komentar maks 2000 karakter" }, { status: 400 });

  const comment = await prisma.jobComment.create({
    data: { jobId: params.id, authorId: userId, content },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ ok: true, comment });
}
