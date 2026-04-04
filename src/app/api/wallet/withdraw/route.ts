import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WithdrawMethod } from "@prisma/client";
import { z } from "zod";
import { verifyOtp } from "@/lib/otp";

const submitSchema = z.object({
  amountIdr: z.number().int().positive(),
  method: z.enum(["BANK", "USDT"]),
  otpCode: z.string().length(6, "Kode OTP harus 6 digit"),
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
  return NextResponse.json(requests.map(r => ({ ...r, amountIdr: Number(r.amountIdr) })));
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

  const { amountIdr, method, otpCode } = parsed.data;

  // Ambil user + nomor HP
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      walletBalance: true,
      phoneWhatsApp: true,
      bankName: true, bankAccountNumber: true, bankAccountHolder: true,
      usdtWithdrawAddress: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  if (!user.phoneWhatsApp) {
    return NextResponse.json({ error: "Nomor WhatsApp belum terdaftar" }, { status: 400 });
  }

  // Verifikasi OTP
  const otpValid = await verifyOtp(session.user.id, "WITHDRAW", user.phoneWhatsApp, otpCode);
  if (!otpValid) {
    return NextResponse.json({ error: "Kode OTP salah atau sudah kadaluarsa" }, { status: 400 });
  }

  // Baca config
  const config = await prisma.withdrawConfig.findUnique({ where: { id: "default" } });
  const minAmount = config?.minAmountIdr ?? 50000;
  const maxAmount = config?.maxAmountIdr ?? 0;

  if (config && !config.withdrawEnabled) return NextResponse.json({ error: "Fitur penarikan sedang tidak tersedia" }, { status: 503 });
  if (method === "BANK" && config && !config.bankEnabled) return NextResponse.json({ error: "Penarikan via bank sedang tidak tersedia" }, { status: 400 });
  if (method === "USDT" && config && !config.usdtEnabled) return NextResponse.json({ error: "Penarikan via USDT sedang tidak tersedia" }, { status: 400 });
  if (amountIdr < minAmount) return NextResponse.json({ error: `Minimal penarikan Rp ${minAmount.toLocaleString("id-ID")}` }, { status: 400 });
  if (maxAmount > 0 && amountIdr > maxAmount) return NextResponse.json({ error: `Maksimal penarikan Rp ${maxAmount.toLocaleString("id-ID")}` }, { status: 400 });

  if (Number(user.walletBalance) < amountIdr) return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 });

  if (method === "BANK" && (!user.bankName || !user.bankAccountNumber || !user.bankAccountHolder)) {
    return NextResponse.json({ error: "Lengkapi data rekening bank terlebih dahulu" }, { status: 400 });
  }
  if (method === "USDT" && !user.usdtWithdrawAddress) {
    return NextResponse.json({ error: "Lengkapi alamat dompet USDT terlebih dahulu" }, { status: 400 });
  }

  const existing = await prisma.withdrawRequest.findFirst({ where: { userId: session.user.id, status: { in: ["PENDING", "PROCESSING"] } } });
  if (existing) return NextResponse.json({ error: "Masih ada pengajuan yang sedang diproses" }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { walletBalance: { decrement: amountIdr } } }),
    prisma.withdrawRequest.create({
      data: {
        userId: session.user.id, amountIdr, method: method as WithdrawMethod,
        bankName: method === "BANK" ? user.bankName : null,
        bankAccountNumber: method === "BANK" ? user.bankAccountNumber : null,
        bankAccountHolder: method === "BANK" ? user.bankAccountHolder : null,
        usdtAddress: method === "USDT" ? user.usdtWithdrawAddress : null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
