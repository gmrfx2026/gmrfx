import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  fullName: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const banks = await prisma.withdrawBankOption.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(banks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const bank = await prisma.withdrawBankOption.create({ data: parsed.data });
    return NextResponse.json(bank, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kode bank sudah ada" }, { status: 409 });
  }
}
