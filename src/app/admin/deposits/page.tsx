import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { AdminDepositCreditButton } from "@/components/admin/AdminDepositCreditButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const STATUS_LABEL: Record<string, string> = {
  PENDING:  "Menunggu",
  VERIFIED: "Dikreditkan",
  FAILED:   "Gagal",
};
const STATUS_CLASS: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-700 ring-amber-200",
  VERIFIED: "bg-green-50 text-green-700 ring-green-200",
  FAILED:   "bg-red-50 text-red-700 ring-red-200",
};

function buildHref(opts: { page?: number; status?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (opts.page && opts.page > 1) sp.set("page", String(opts.page));
  if (opts.status) sp.set("status", opts.status);
  if (opts.q) sp.set("q", opts.q);
  const qs = sp.toString();
  return `/admin/deposits${qs ? `?${qs}` : ""}`;
}

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; q?: string };
}) {
  const pageRaw  = Math.max(1, parseInt(searchParams.page  ?? "1",  10) || 1);
  const statusFilter = searchParams.status ?? "";
  const q = (searchParams.q ?? "").trim();

  const where = {
    ...(statusFilter ? { status: statusFilter as "PENDING" | "VERIFIED" | "FAILED" } : {}),
    ...(q
      ? {
          OR: [
            { txHash: { contains: q, mode: "insensitive" as const } },
            { user: { name:  { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const total      = await prisma.usdtDepositRequest.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page       = Math.min(pageRaw, totalPages);
  const skip       = (page - 1) * PAGE_SIZE;

  const rows = await prisma.usdtDepositRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      user: { select: { name: true, email: true, walletAddress: true } },
    },
  });

  // Ringkasan total per status
  const [countVerified, countFailed, countPending, totalUsdtVerified, totalIdrVerified] =
    await Promise.all([
      prisma.usdtDepositRequest.count({ where: { status: "VERIFIED" } }),
      prisma.usdtDepositRequest.count({ where: { status: "FAILED"   } }),
      prisma.usdtDepositRequest.count({ where: { status: "PENDING"  } }),
      prisma.usdtDepositRequest.aggregate({
        where: { status: "VERIFIED" },
        _sum: { amountUsdt: true },
      }),
      prisma.usdtDepositRequest.aggregate({
        where: { status: "VERIFIED" },
        _sum: { amountIdr: true },
      }),
    ]);

  const pagerBase = { status: statusFilter, q };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Deposit USDT</h1>
      <p className="mt-1 text-sm text-gray-600">
        Riwayat semua permintaan deposit USDT (BEP-20) dari member.
      </p>

      {/* Kartu ringkasan */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Dikreditkan",
            value: countVerified,
            sub: `${Number(totalUsdtVerified._sum.amountUsdt ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} USDT`,
            color: "border-green-200 bg-green-50",
            textColor: "text-green-800",
          },
          {
            label: "Total IDR dikreditkan",
            value: `Rp ${Number(totalIdrVerified._sum.amountIdr ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`,
            sub: "semua deposit berhasil",
            color: "border-emerald-200 bg-emerald-50",
            textColor: "text-emerald-800",
          },
          {
            label: "Menunggu",
            value: countPending,
            sub: "belum diverifikasi",
            color: "border-amber-200 bg-amber-50",
            textColor: "text-amber-800",
          },
          {
            label: "Gagal",
            value: countFailed,
            sub: "TX tidak valid",
            color: "border-red-200 bg-red-50",
            textColor: "text-red-800",
          },
        ].map((c) => (
          <div key={c.label} className={`rounded-lg border p-4 ${c.color}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${c.textColor}`}>{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.textColor}`}>{c.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <form
        action="/admin/deposits"
        method="get"
        className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="min-w-[200px] flex-[2]">
          <label className="block text-xs font-medium text-gray-500">Cari (nama, email, TxHash)</label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="0x… atau nama member"
            maxLength={80}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500">Status</label>
          <select
            name="status"
            defaultValue={statusFilter}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            <option value="VERIFIED">Dikreditkan</option>
            <option value="PENDING">Menunggu</option>
            <option value="FAILED">Gagal</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Terapkan
          </button>
          <Link
            href="/admin/deposits"
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset
          </Link>
        </div>
      </form>

      <p className="mt-3 text-sm text-gray-600">
        {total === 0 ? (
          "Tidak ada data yang cocok."
        ) : (
          <>
            Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} dari{" "}
            {total.toLocaleString("id-ID")} deposit
            {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
          </>
        )}
      </p>

      {/* Tabel */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">USDT</th>
              <th className="px-4 py-3">Kurs</th>
              <th className="px-4 py-3">IDR dikreditkan</th>
              <th className="px-4 py-3">TxHash</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500">
                  {formatJakarta(r.createdAt, { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-gray-800">{r.user.name ?? "—"}</div>
                  <div className="text-xs text-gray-500">{r.user.email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                      STATUS_CLASS[r.status] ?? "bg-gray-50 text-gray-600 ring-gray-200"
                    }`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-sm text-gray-800">
                  {Number(r.amountUsdt).toFixed(4)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-600">
                  {r.status === "VERIFIED"
                    ? Number(r.rateIdr).toLocaleString("id-ID", { maximumFractionDigits: 0 })
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">
                  {r.status === "VERIFIED"
                    ? `Rp ${Number(r.amountIdr).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
                    : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <a
                    href={`https://bscscan.com/tx/${r.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={r.txHash}
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {r.txHash.slice(0, 10)}…{r.txHash.slice(-6)}
                  </a>
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-red-600" title={r.failReason ?? ""}>
                  {r.failReason ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  {r.status !== "VERIFIED" && (
                    <AdminDepositCreditButton
                      depositId={r.id}
                      amountUsdt={Number(r.amountUsdt)}
                      currentRateIdr={Number(r.rateIdr) || 16000}
                      memberName={r.user.name ?? r.user.email}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginasi */}
      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={buildHref({ ...pagerBase, page: Math.max(1, page - 1) })}
            className={`rounded border border-gray-300 px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sebelumnya
          </Link>
          <span className="text-gray-600">
            {page} / {totalPages}
          </span>
          <Link
            href={buildHref({ ...pagerBase, page: Math.min(totalPages, page + 1) })}
            className={`rounded border border-gray-300 px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Berikutnya
          </Link>
        </nav>
      )}
    </div>
  );
}
