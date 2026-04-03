import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const JOB_EXPIRE_DAYS = 30;
const MIN_BUDGET = 10_000; // Rp 10.000

// GET /api/penawaran — daftar pekerjaan OPEN (publik, dengan filter)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  // Lazy: tandai expired yang belum di-cancel
  await expireOldJobs();

  const where = {
    status: "OPEN" as const,
    ...(category && ["EA", "INDICATOR", "OTHER"].includes(category)
      ? { category: category as "EA" | "INDICATOR" | "OTHER" }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.jobOffer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        budgetIdr: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        requester: { select: { id: true, name: true, image: true, memberSlug: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.jobOffer.count({ where }),
  ]);

  return NextResponse.json({
    jobs: jobs.map((j) => ({ ...j, budgetIdr: j.budgetIdr.toString() })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/penawaran — buat pekerjaan baru, kunci dana dari wallet
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  let body: { title?: string; description?: string; category?: string; budgetIdr?: number; expireDays?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  const category = (body.category ?? "").toUpperCase();
  const budgetIdr = Number(body.budgetIdr ?? 0);
  const expireDays = Math.min(90, Math.max(7, Number(body.expireDays ?? JOB_EXPIRE_DAYS)));

  if (!title || title.length > 200) return NextResponse.json({ error: "Judul tidak valid (maks 200 karakter)" }, { status: 400 });
  if (!description || description.length < 20) return NextResponse.json({ error: "Deskripsi terlalu pendek (min 20 karakter)" }, { status: 400 });
  if (!["EA", "INDICATOR", "OTHER"].includes(category)) return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  if (!Number.isFinite(budgetIdr) || budgetIdr < MIN_BUDGET) return NextResponse.json({ error: `Budget minimum Rp ${MIN_BUDGET.toLocaleString("id-ID")}` }, { status: 400 });

  // Cek saldo cukup
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  if (Number(user.walletBalance) < budgetIdr) {
    return NextResponse.json({ error: `Saldo tidak cukup. Saldo Anda: Rp ${Number(user.walletBalance).toLocaleString("id-ID")}` }, { status: 422 });
  }

  const expiresAt = new Date(Date.now() + expireDays * 86_400_000);
  const txId = `JOB-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

  // Atomic: buat job + potong saldo
  const [job] = await prisma.$transaction([
    prisma.jobOffer.create({
      data: {
        title,
        description,
        category: category as "EA" | "INDICATOR" | "OTHER",
        budgetIdr: new Decimal(budgetIdr.toFixed(2)),
        expiresAt,
        requesterId: userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: new Decimal(budgetIdr.toFixed(2)) } },
    }),
    prisma.walletTransfer.create({
      data: {
        transactionId: txId,
        fromUserId: userId,
        toUserId: userId, // "self-escrow" — dicatat untuk audit
        amount: new Decimal(budgetIdr.toFixed(2)),
        note: `[ESCROW-JOB] Dana dikunci untuk penawaran pekerjaan`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, jobId: job.id });
}

/** Tandai pekerjaan OPEN yang sudah expired sebagai CANCELLED dan kembalikan dana. */
async function expireOldJobs() {
  const expired = await prisma.jobOffer.findMany({
    where: { status: "OPEN", expiresAt: { lt: new Date() } },
    select: { id: true, requesterId: true, budgetIdr: true },
  });

  for (const job of expired) {
    const txId = `REF-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    await prisma.$transaction([
      prisma.jobOffer.update({ where: { id: job.id }, data: { status: "CANCELLED" } }),
      prisma.user.update({
        where: { id: job.requesterId },
        data: { walletBalance: { increment: job.budgetIdr } },
      }),
      prisma.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: job.requesterId,
          toUserId: job.requesterId,
          amount: job.budgetIdr,
          note: `[REFUND-JOB] Dana dikembalikan — penawaran habis tanpa pemenang`,
        },
      }),
    ]);
  }

  // Auto-release pekerjaan DELIVERED yang sudah melewati autoReleaseAt
  const toRelease = await prisma.jobOffer.findMany({
    where: { status: "DELIVERED", autoReleaseAt: { lt: new Date() }, winnerId: { not: null } },
    select: { id: true, winnerId: true, budgetIdr: true, requesterId: true },
  });

  for (const job of toRelease) {
    if (!job.winnerId) continue;
    const txId = `PAY-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    await prisma.$transaction([
      prisma.jobOffer.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
      prisma.user.update({
        where: { id: job.winnerId },
        data: { walletBalance: { increment: job.budgetIdr } },
      }),
      prisma.walletTransfer.create({
        data: {
          transactionId: txId,
          fromUserId: job.requesterId,
          toUserId: job.winnerId,
          amount: job.budgetIdr,
          note: `[PAY-JOB] Pembayaran pekerjaan (auto-release 3 hari)`,
        },
      }),
    ]);
  }
}
