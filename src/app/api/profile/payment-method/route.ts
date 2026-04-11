import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const BANKS = ["BCA", "BNI", "MANDIRI", "BRI"] as const;

const schema = z.object({
  bankName: z.enum(BANKS).nullable().optional(),
  bankAccountNumber: z.string().max(30).regex(/^\d*$/, "Hanya angka").nullable().optional(),
  bankAccountHolder: z.string().max(100).nullable().optional(),
  usdtWithdrawAddress: z
    .string()
    .max(66)
    .regex(/^(0x[a-fA-F0-9]{40})?$/, "Format alamat BSC tidak valid (harus 0x…42 karakter)")
    .nullable()
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { bankName: true, bankAccountNumber: true, bankAccountHolder: true, usdtWithdrawAddress: true },
    });
    return NextResponse.json(
      user ?? {
        bankName: null,
        bankAccountNumber: null,
        bankAccountHolder: null,
        usdtWithdrawAddress: null,
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      console.warn("[payment-method] Kolom payment method belum tersedia di database; kirim nilai kosong.");
      return NextResponse.json({
        bankName: null,
        bankAccountNumber: null,
        bankAccountHolder: null,
        usdtWithdrawAddress: null,
        skipped: true,
        reason: "payment-method-unavailable",
      });
    }
    throw error;
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const data = parsed.data;

  // Jika bankName dikosongkan, kosongkan juga nomor & nama pemilik
  const update: Record<string, unknown> = {};
  if ("bankName" in data) update.bankName = data.bankName ?? null;
  if ("bankAccountNumber" in data) update.bankAccountNumber = data.bankAccountNumber?.trim() || null;
  if ("bankAccountHolder" in data) update.bankAccountHolder = data.bankAccountHolder?.trim() || null;
  if ("usdtWithdrawAddress" in data) update.usdtWithdrawAddress = data.usdtWithdrawAddress?.trim() || null;

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: update });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      console.warn("[payment-method] Kolom payment method belum tersedia di database; simpan dibatalkan.");
      return NextResponse.json(
        { error: "Fitur data pembayaran belum tersedia di server. Silakan deploy migrasi database terlebih dahulu." },
        { status: 503 }
      );
    }
    throw error;
  }
}
