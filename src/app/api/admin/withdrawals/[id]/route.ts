import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["processing", "approve", "reject"]),
  adminNote: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const { action, adminNote } = parsed.data;

  const wr = await prisma.withdrawRequest.findUnique({ where: { id: params.id } });
  if (!wr) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  if (action === "processing") {
    if (wr.status !== "PENDING") return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    await prisma.withdrawRequest.update({
      where: { id: params.id },
      data: { status: "PROCESSING", adminNote: adminNote ?? wr.adminNote },
    });
    return NextResponse.json({ ok: true, status: "PROCESSING" });
  }

  if (action === "approve") {
    if (!["PENDING", "PROCESSING"].includes(wr.status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }
    await prisma.withdrawRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
        adminNote: adminNote ?? wr.adminNote,
      },
    });
    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  if (action === "reject") {
    if (!["PENDING", "PROCESSING"].includes(wr.status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }
    // Kembalikan saldo ke member
    await prisma.$transaction([
      prisma.withdrawRequest.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          processedAt: new Date(),
          adminNote: adminNote ?? wr.adminNote,
        },
      }),
      prisma.user.update({
        where: { id: wr.userId },
        data: { walletBalance: { increment: wr.amountIdr } },
      }),
    ]);
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
}
