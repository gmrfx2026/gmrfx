import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  withdrawEnabled: z.boolean().optional(),
  bankEnabled: z.boolean().optional(),
  usdtEnabled: z.boolean().optional(),
  minAmountIdr: z.number().int().min(0).optional(),
  maxAmountIdr: z.number().int().min(0).optional(),
  bankFeeIdr: z.number().int().min(0).optional(),
  usdtFeeIdr: z.number().int().min(0).optional(),
  usdtNetwork: z.string().max(50).optional(),
  processingNote: z.string().max(500).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = await prisma.withdrawConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", updatedAt: new Date() },
  });
  return NextResponse.json(cfg);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const cfg = await prisma.withdrawConfig.upsert({
    where: { id: "default" },
    update: { ...parsed.data, updatedAt: new Date() },
    create: { id: "default", ...parsed.data, updatedAt: new Date() },
  });
  return NextResponse.json(cfg);
}
