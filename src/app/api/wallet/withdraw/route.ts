import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WithdrawMethod } from "@prisma/client";
import { z } from "zod";

const MIN_WITHDRAW_IDR = 50_000;

const submitSchema = z.object({
  amountIdr: z.number().int().min(MIN_WITHDRAW_IDR, `Minimal penarikan Rp ${MIN_WITHDRAW_IDR.toLocaleString("id-ID")}`),
  method: z.enum(["BANK", "USDT"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.withdrawRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, amountIdr: true, method: true, status: true,
      bankName: true, bankAccountNumber: true, bankAccountHolder: true,
      usdtAddress: true, adminNote: true, createdAt: true, processedAt: true,
    },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Data tidak valid";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { amountIdr, method } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      walletBalance: true,
      bankName: true, bankAccountNumber: true, bankAccountHolder: true,
      usdtWithdrawAddress: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  // Validasi saldo
  if (Number(user.walletBalance) < amountIdr) {
    return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 });
  }

  // Validasi metode pembayaran
  if (method === "BANK") {
    if (!user.bankName || !user.bankAccountNumber || !user.bankAccountHolder) {
      return NextResponse.json(
        { error: "Lengkapi data rekening bank terlebih dahulu di menu Rekening & Dompet" },
        { status: 400 },
      );
    }
  }
  if (method === "USDT") {
    if (!user.usdtWithdrawAddress) {
      return NextResponse.json(
        { error: "Lengkapi alamat dompet USDT terlebih dahulu di menu Rekening & Dompet" },
        { status: 400 },
      );
    }
  }

  // Cek tidak ada pengajuan PENDING / PROCESSING sebelumnya
  const existing = await prisma.withdrawRequest.findFirst({
    where: { userId: session.user.id, status: { in: ["PENDING", "PROCESSING"] } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Masih ada pengajuan penarikan yang sedang diproses. Tunggu hingga selesai." },
      { status: 400 },
    );
  }

  // Kunci saldo (deduct) + buat request secara atomik
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { walletBalance: { decrement: amountIdr } },
    }),
    prisma.withdrawRequest.create({
      data: {
        userId: session.user.id,
        amountIdr,
        method: method as WithdrawMethod,
        bankName: method === "BANK" ? user.bankName : null,
        bankAccountNumber: method === "BANK" ? user.bankAccountNumber : null,
        bankAccountHolder: method === "BANK" ? user.bankAccountHolder : null,
        usdtAddress: method === "USDT" ? user.usdtWithdrawAddress : null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
