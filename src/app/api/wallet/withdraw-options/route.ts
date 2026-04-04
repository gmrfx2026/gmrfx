import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Endpoint publik (member terotentikasi): bank aktif + konfigurasi penarikan. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [banks, config] = await Promise.all([
    prisma.withdrawBankOption.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, code: true, fullName: true },
    }),
    prisma.withdrawConfig.findUnique({ where: { id: "default" } }),
  ]);

  return NextResponse.json({
    banks,
    config: config ?? {
      withdrawEnabled: true, bankEnabled: true, usdtEnabled: true,
      minAmountIdr: 50000, maxAmountIdr: 0,
      bankFeeIdr: 0, usdtFeeIdr: 0,
      usdtNetwork: "BSC (BEP-20)", processingNote: null,
    },
  });
}
