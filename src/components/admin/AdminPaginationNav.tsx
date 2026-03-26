import Link from "next/link";
import { buildAdminListHref } from "@/lib/adminListParams";

export function AdminPaginationNav({
  path,
  page,
  totalPages,
  perPage,
  q,
}: {
  path: string;
  page: number;
  totalPages: number;
  perPage: number;
  q: string;
}) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Pagination">
      <Link
        href={buildAdminListHref(path, { page: prev, perPage, q })}
        className={`rounded border border-gray-300 px-3 py-1.5 ${
          page <= 1 ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        Sebelumnya
      </Link>
      <Link
        href={buildAdminListHref(path, { page: next, perPage, q })}
        className={`rounded border border-gray-300 px-3 py-1.5 ${
          page >= totalPages ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        Berikutnya
      </Link>
    </nav>
  );
}
