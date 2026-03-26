import Link from "next/link";
import { buildArtikelCommentPageHref } from "@/lib/articleCommentPagination";

export function ArticleCommentPaginationNav({
  slug,
  page,
  totalPages,
}: {
  slug: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Halaman komentar">
      <Link
        href={buildArtikelCommentPageHref(slug, prev)}
        className={`rounded border border-broker-border px-3 py-1.5 ${
          page <= 1 ? "pointer-events-none opacity-40" : "text-broker-muted hover:border-broker-accent/40 hover:text-white"
        }`}
      >
        Sebelumnya
      </Link>
      <span className="text-broker-muted">
        Halaman {page} / {totalPages}
      </span>
      <Link
        href={buildArtikelCommentPageHref(slug, next)}
        className={`rounded border border-broker-border px-3 py-1.5 ${
          page >= totalPages ? "pointer-events-none opacity-40" : "text-broker-muted hover:border-broker-accent/40 hover:text-white"
        }`}
      >
        Berikutnya
      </Link>
    </nav>
  );
}
