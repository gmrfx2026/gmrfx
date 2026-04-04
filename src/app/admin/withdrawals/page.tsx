import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WithdrawTable } from "./WithdrawActions";

export const metadata: Metadata = { title: "Penarikan Saldo — Admin GMR FX" };
export const dynamic = "force-dynamic";

function fmtIDR(n: number) { return "Rp " + Number(n).toLocaleString("id-ID"); }

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status;
  const validStatuses = ["PENDING", "PROCESSING", "APPROVED", "REJECTED"];
  const whereStatus = validStatuses.includes(statusFilter ?? "") ? statusFilter : undefined;

  const [pending, processing, approved, rejected, requests] = await Promise.all([
    prisma.withdrawRequest.count({ where: { status: "PENDING" } }),
    prisma.withdrawRequest.count({ where: { status: "PROCESSING" } }),
    prisma.withdrawRequest.count({ where: { status: "APPROVED" } }),
    prisma.withdrawRequest.count({ where: { status: "REJECTED" } }),
    prisma.withdrawRequest.findMany({
      where: whereStatus ? { status: whereStatus as "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED" } : undefined,
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 100,
      include: {
        user: { select: { name: true, email: true, walletBalance: true } },
      },
    }),
  ]);

  // Total IDR pending
  const pendingAgg = await prisma.withdrawRequest.aggregate({
    where: { status: { in: ["PENDING", "PROCESSING"] } },
    _sum: { amountIdr: true },
  });
  const totalPendingIdr = Number(pendingAgg._sum.amountIdr ?? 0);

  const tabs = [
    { label: "Semua", value: undefined, count: pending + processing + approved + rejected },
    { label: "Menunggu", value: "PENDING", count: pending, alert: pending > 0 },
    { label: "Diproses", value: "PROCESSING", count: processing },
    { label: "Selesai", value: "APPROVED", count: approved },
    { label: "Ditolak", value: "REJECTED", count: rejected },
  ];

  const serialized = requests.map((r) => ({
    ...r,
    amountIdr: Number(r.amountIdr),
    user: { ...r.user, walletBalance: Number(r.user.walletBalance) },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Penarikan Saldo</h1>
        <p className="mt-0.5 text-sm text-gray-500">Kelola pengajuan penarikan saldo IDR member ke rekening bank atau dompet USDT.</p>
      </div>

      {totalPendingIdr > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Total saldo dikunci (Menunggu + Diproses): <strong>{fmtIDR(totalPendingIdr)}</strong>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = (whereStatus ?? undefined) === t.value;
          const href = t.value ? `/admin/withdrawals?status=${t.value}` : "/admin/withdrawals";
          return (
            <a
              key={t.label}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              } ${t.alert ? "ring-2 ring-amber-400" : ""}`}
            >
              {t.label} {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
            </a>
          );
        })}
      </div>

      {serialized.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Tidak ada pengajuan penarikan.
        </div>
      ) : (
        <WithdrawTable requests={serialized} />
      )}
    </div>
  );
}
