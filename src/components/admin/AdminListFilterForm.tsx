import Link from "next/link";

export function AdminListFilterForm({
  actionPath,
  qDefault,
  perPageDefault,
  searchPlaceholder = "Cari…",
}: {
  actionPath: string;
  qDefault: string;
  perPageDefault: number;
  searchPlaceholder?: string;
}) {
  return (
    <form
      action={actionPath}
      method="get"
      className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
    >
      <div className="min-w-[200px] flex-[2]">
        <label className="block text-xs font-medium text-gray-500">Cari</label>
        <input
          type="search"
          name="q"
          defaultValue={qDefault}
          placeholder={searchPlaceholder}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          maxLength={120}
        />
      </div>
      <div className="min-w-[100px]">
        <label className="block text-xs font-medium text-gray-500">Per halaman</label>
        <select
          name="perPage"
          defaultValue={String(perPageDefault)}
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
          href={actionPath}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

/** Teks ringkas jumlah baris (boleh dipakai di bawah form). */
export function AdminListSummary({
  total,
  page,
  pageSize,
  totalPages,
}: {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <p className="mt-3 text-sm text-gray-600">
      {total === 0 ? (
        <>Tidak ada data yang cocok dengan filter.</>
      ) : (
        <>
          Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari{" "}
          {total.toLocaleString("id-ID")} entri
          {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
        </>
      )}
    </p>
  );
}
