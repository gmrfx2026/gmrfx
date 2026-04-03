import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Penawaran Pekerjaan — Admin GMR FX" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka", ASSIGNED: "Dikerjakan", DELIVERED: "Menunggu konfirmasi",
  COMPLETED: "Selesai", CANCELLED: "Dibatalkan", DISPUTED: "Sengketa",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-emerald-700 bg-emerald-50",
  ASSIGNED: "text-blue-700 bg-blue-50",
  DELIVERED: "text-amber-700 bg-amber-50",
  COMPLETED: "text-gray-500 bg-gray-100",
  CANCELLED: "text-red-600 bg-red-50",
  DISPUTED: "text-orange-700 bg-orange-50",
};

function fmtIdr(v: { toString(): string }) {
  return Number(v.toString()).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminJobOffersPage() {
  const [jobs, counts] = await Promise.all([
    prisma.jobOffer.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        requester: { select: { id: true, name: true } },
        winner: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.jobOffer.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Penawaran Pekerjaan</h1>
        <Link href="/penawaran" target="_blank" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          Lihat halaman publik →
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(["OPEN", "ASSIGNED", "DELIVERED", "DISPUTED", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <div key={s} className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-900">{countMap[s] ?? 0}</p>
            <p className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold inline-block ${STATUS_COLOR[s]}`}>{STATUS_LABEL[s]}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Pekerjaan", "Budget", "Pemberi", "Pemenang", "Tawaran", "Status", "Expires", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.category}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">Rp {fmtIdr(job.budgetIdr)}</td>
                <td className="px-4 py-3 text-gray-600">{job.requester.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{job.winner?.name ?? "—"}</td>
                <td className="px-4 py-3 text-center text-gray-600">{job._count.bids}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[job.status] ?? ""}`}>
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(job.expiresAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/penawaran/${job.id}`} target="_blank" className="text-xs text-indigo-600 hover:underline">
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Belum ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
