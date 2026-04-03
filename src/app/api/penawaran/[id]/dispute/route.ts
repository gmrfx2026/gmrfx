import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/penawaran/[id]/dispute — ajukan komplain (pemberi kerja)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const job = await prisma.jobOffer.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Pekerjaan tidak ditemukan" }, { status: 404 });
  if (job.requesterId !== userId) return NextResponse.json({ error: "Hanya pemberi kerja yang bisa mengajukan komplain" }, { status: 403 });
  if (job.status !== "DELIVERED") return NextResponse.json({ error: "Komplain hanya bisa diajukan setelah hasil dikirim" }, { status: 409 });

  let body: { reason?: string };
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ error: "Body tidak valid" }, { status: 400 }); }

  const reason = (body.reason ?? "").trim();
  if (!reason || reason.length < 10) return NextResponse.json({ error: "Alasan komplain terlalu pendek (min 10 karakter)" }, { status: 400 });

  await prisma.jobOffer.update({
    where: { id: params.id },
    data: { status: "DISPUTED", disputeReason: reason.slice(0, 1000) },
  });

  return NextResponse.json({ ok: true });
}
