import Link from "next/link";

export type WalletHistoryRow = {
  id: string;
  transactionId: string;
  direction: "in" | "out";
  amount: number;
  note: string | null;
  createdAt: string;
  counterpartyLabel: string;
  counterpartyWallet: string | null;
};

function profilWalletHref(opts: {
  wPage?: number;
  wPerPage?: number;
  wFrom?: string;
  wTo?: string;
  wQ?: string;
}) {
  const sp = new URLSearchParams();
  sp.set("tab", "wallet");
  if (opts.wPage != null && opts.wPage > 1) sp.set("wPage", String(opts.wPage));
  if (opts.wPerPage != null && opts.wPerPage !== 20) sp.set("wPerPage", String(opts.wPerPage));
  if (opts.wFrom) sp.set("wFrom", opts.wFrom);
  if (opts.wTo) sp.set("wTo", opts.wTo);
  if (opts.wQ) sp.set("wQ", opts.wQ);
  const q = sp.toString();
  return `/profil${q ? `?${q}` : ""}`;
}

export function ProfilWalletHistory({
  rows,
  total,
  page,
  pageSize,
  fromStr,
  toStr,
  q,
}: {
  rows: WalletHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
  fromStr: string;
  toStr: string;
  q: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const pagerBase = { wPerPage: pageSize, wFrom: fromStr, wTo: toStr, wQ: q };

  return (
    <section className="mt-10 border-t border-broker-border pt-10">
      <h2 className="text-lg font-semibold text-white">Riwayat transfer</h2>
      <p className="mt-1 text-xs text-broker-muted">
        Uang masuk dan keluar dari wallet Anda. Filter tanggal dan cari berdasarkan ID transaksi, catatan, nama,
        email, atau alamat wallet lawan transaksi.
      </p>

      <form action="/profil" method="get" className="mt-4 flex flex-col gap-3 rounded-xl border border-broker-border bg-broker-surface/30 p-4 md:flex-row md:flex-wrap md:items-end">
        <input type="hidden" name="tab" value="wallet" />
        <div className="min-w-[140px] flex-1">
          <label className="block text-xs text-broker-muted">Dari tanggal</label>
          <input
            type="date"
            name="wFrom"
            defaultValue={fromStr}
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="block text-xs text-broker-muted">Sampai tanggal</label>
          <input
            type="date"
            name="wTo"
            defaultValue={toStr}
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="min-w-[180px] flex-[2]">
          <label className="block text-xs text-broker-muted">Cari</label>
          <input
            type="search"
            name="wQ"
            defaultValue={q}
            placeholder="ID transaksi, catatan, lawan…"
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
            maxLength={120}
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs text-broker-muted">Per halaman</label>
          <select
            name="wPerPage"
            defaultValue={String(pageSize)}
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
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
            className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg hover:opacity-90"
          >
            Terapkan
          </button>
          <Link
            href="/profil?tab=wallet"
            className="rounded-lg border border-broker-border px-4 py-2 text-sm text-broker-muted hover:bg-broker-surface/50"
          >
            Reset
          </Link>
        </div>
      </form>

      <p className="mt-3 text-xs text-broker-muted">
        {total === 0 ? (
          <>Tidak ada transaksi yang cocok dengan filter.</>
        ) : (
          <>
            Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari{" "}
            {total.toLocaleString("id-ID")} transaksi
            {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
          </>
        )}
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-broker-muted">
          {total === 0 ? "Belum ada riwayat atau tidak ada hasil untuk filter ini." : "Tidak ada data di halaman ini."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-broker-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-broker-border bg-broker-surface/60 text-xs uppercase text-broker-muted">
              <tr>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Jenis</th>
                <th className="px-3 py-2">Jumlah (IDR)</th>
                <th className="px-3 py-2">Lawan</th>
                <th className="px-3 py-2">ID transaksi</th>
                <th className="px-3 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-broker-border/60 hover:bg-broker-surface/30">
                  <td className="whitespace-nowrap px-3 py-2 text-broker-muted">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(r.createdAt))}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.direction === "in"
                          ? "font-medium text-broker-accent"
                          : "font-medium text-broker-danger"
                      }
                    >
                      {r.direction === "in" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-white">
                    {r.amount.toLocaleString("id-ID", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2 text-broker-muted">
                    <div>{r.counterpartyLabel}</div>
                    {r.counterpartyWallet && (
                      <div className="font-mono text-xs text-broker-gold">{r.counterpartyWallet}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-broker-muted">{r.transactionId}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-broker-muted" title={r.note ?? ""}>
                    {r.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Pagination">
          <Link
            href={profilWalletHref({ ...pagerBase, wPage: Math.max(1, page - 1) })}
            className={`rounded-lg border border-broker-border px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-broker-muted hover:bg-broker-surface/50"
            }`}
            aria-disabled={page <= 1}
          >
            Sebelumnya
          </Link>
          <Link
            href={profilWalletHref({ ...pagerBase, wPage: Math.min(totalPages, page + 1) })}
            className={`rounded-lg border border-broker-border px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-40" : "text-broker-muted hover:bg-broker-surface/50"
            }`}
            aria-disabled={page >= totalPages}
          >
            Berikutnya
          </Link>
        </nav>
      )}
    </section>
  );
}
