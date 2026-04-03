import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

// POST /api/penawaran/[id]/bid — ajukan tawaran harga
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });
  if (job.status !== "OPEN") return NextResponse.json({ error: "Pekerjaan sudah tidak menerima tawaran" }, { status: 409 });
  if (job.expiresAt < new Date()) return NextResponse.json({ error: "Masa penawaran sudah habis" }, { status: 409 });
  if (job.requesterId === userId) return NextResponse.json({ error: "Tidak bisa menawar pekerjaan sendiri" }, { status: 403 });

  const existing = await prisma.jobBid.findUnique({ where: { jobId_bidderId: { jobId: params.id, bidderId: userId } } });
  if (existing) return NextResponse.json({ error: "Anda sudah mengajukan tawaran untuk pekerjaan ini" }, { status: 409 });

  let body: { priceIdr?: number; message?: string };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }

  const priceIdr = Number(body.priceIdr ?? 0);
  const message = (body.message ?? "").trim();
  if (!Number.isFinite(priceIdr) || priceIdr < 1000) return NextResponse.json({ error: "Harga tawaran minimum Rp 1.000" }, { status: 400 });
  if (priceIdr > Number(job.budgetIdr)) {
    return NextResponse.json(
      { error: `Harga tawaran tidak boleh melebihi budget pemberi kerja (Rp ${Number(job.budgetIdr).toLocaleString("id-ID")})` },
      { status: 400 }
    );
  }
  if (!message || message.length < 10) return NextResponse.json({ error: "Pesan terlalu pendek (min 10 karakter)" }, { status: 400 });

  const bid = await prisma.jobBid.create({
    data: { jobId: params.id, bidderId: userId, priceIdr: new Decimal(priceIdr.toFixed(2)), message },
  });

  return NextResponse.json({ ok: true, bidId: bid.id });
}
