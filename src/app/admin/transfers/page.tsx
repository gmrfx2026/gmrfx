import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  adminWalletTransferWhere,
  normalizeDateRange,
  parseWalletHistoryListParams,
} from "@/lib/walletTransferFilters";

export const dynamic = "force-dynamic";

function adminTransfersHref(opts: {
  page?: number;
  perPage?: number;
  from?: string;
  to?: string;
  q?: string;
}) {
  const sp = new URLSearchParams();
  if (opts.page != null && opts.page > 1) sp.set("page", String(opts.page));
  if (opts.perPage != null && opts.perPage !== 20) sp.set("perPage", String(opts.perPage));
  if (opts.from) sp.set("from", opts.from);
  if (opts.to) sp.set("to", opts.to);
  if (opts.q) sp.set("q", opts.q);
  const qs = sp.toString();
  return `/admin/transfers${qs ? `?${qs}` : ""}`;
}

export default async function AdminTransfersPage({
  searchParams,
}: {
  searchParams: { page?: string; from?: string; to?: string; q?: string; perPage?: string };
}) {
  const lp = parseWalletHistoryListParams(
    searchParams as Record<string, string | string[] | undefined>,
    ""
  );
  const { from: fd, to: td } = normalizeDateRange(lp.fromDate, lp.toDate);
  const where = adminWalletTransferWhere({
    from: fd ?? undefined,
    to: td ?? undefined,
    q: lp.q,
  });

  const total = await prisma.walletTransfer.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / lp.pageSize) || 1);
  const page = Math.min(Math.max(1, lp.page), totalPages);
  const skip = (page - 1) * lp.pageSize;

  const transfers = await prisma.walletTransfer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: lp.pageSize,
    include: {
      fromUser: { select: { name: true, email: true, walletAddress: true } },
      toUser: { select: { name: true, email: true, walletAddress: true } },
    },
  });

  const pagerBase = { perPage: lp.pageSize, from: lp.fromStr, to: lp.toStr, q: lp.q };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Riwayat transfer wallet</h1>
      <p className="mt-1 text-sm text-gray-600">
        Semua transfer antar member. Filter tanggal, cari ID transaksi, catatan, nama, email, atau alamat wallet
        (pengirim/penerima).
      </p>

      <form
        action="/admin/transfers"
        method="get"
        className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
      >
        <div className="min-w-[140px] flex-1">
          <label className="block text-xs font-medium text-gray-500">Dari tanggal</label>
          <input
            type="date"
            name="from"
            defaultValue={lp.fromStr}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="block text-xs font-medium text-gray-500">Sampai tanggal</label>
          <input
            type="date"
            name="to"
            defaultValue={lp.toStr}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[200px] flex-[2]">
          <label className="block text-xs font-medium text-gray-500">Cari</label>
          <input
            type="search"
            name="q"
            defaultValue={lp.q}
            placeholder="ID transaksi, member, catatan…"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            maxLength={120}
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs font-medium text-gray-500">Per halaman</label>
          <select
            name="perPage"
            defaultValue={String(lp.pageSize)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
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
            href="/admin/transfers"
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset
          </Link>
        </div>
      </form>

      <p className="mt-3 text-sm text-gray-600">
        {total === 0 ? (
          <>Tidak ada transaksi yang cocok dengan filter.</>
        ) : (
          <>
            Menampilkan {(page - 1) * lp.pageSize + 1}–{Math.min(page * lp.pageSize, total)} dari{" "}
            {total.toLocaleString("id-ID")} transaksi
            {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
          </>
        )}
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">ID transaksi</th>
              <th className="px-4 py-3">Dari</th>
              <th className="px-4 py-3">Ke</th>
              <th className="px-4 py-3">Jumlah (IDR)</th>
              <th className="px-4 py-3">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                    t.createdAt
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-700">{t.transactionId}</td>
                <td className="px-4 py-2">
                  <div className="text-gray-800">{t.fromUser.name ?? t.fromUser.email}</div>
                  <div className="font-mono text-xs text-gray-500">{t.fromUser.walletAddress}</div>
                </td>
                <td className="px-4 py-2">
                  <div className="text-gray-800">{t.toUser.name ?? t.toUser.email}</div>
                  <div className="font-mono text-xs text-gray-500">{t.toUser.walletAddress}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                  {Number(t.amount).toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2 text-gray-600" title={t.note ?? ""}>
                  {t.note ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Pagination">
          <Link
            href={adminTransfersHref({ ...pagerBase, page: Math.max(1, page - 1) })}
            className={`rounded border border-gray-300 px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sebelumnya
          </Link>
          <Link
            href={adminTransfersHref({ ...pagerBase, page: Math.min(totalPages, page + 1) })}
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
