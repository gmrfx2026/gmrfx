import Link from "next/link";
import { buildProfilArticleListHref } from "@/lib/adminListParams";

type ArticleRow = { id: string; title: string; status: string; slug: string };

export function ProfilArticlesSection({
  profileTab,
  articles,
  total,
  page,
  pageSize,
  totalPages,
  q,
}: {
  profileTab: string;
  articles: ArticleRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
}) {
  const base = { perPage: pageSize, q };
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <section className="border-t border-broker-border pt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Artikel saya</h2>
        <Link
          href="/profil/artikel/baru"
          className="text-sm font-medium text-broker-accent hover:underline"
        >
          Tulis artikel
        </Link>
      </div>

      <form
        action="/profil"
        method="get"
        className="mb-4 flex flex-col gap-3 rounded-xl border border-broker-border bg-broker-surface/30 p-4 md:flex-row md:flex-wrap md:items-end"
      >
        {profileTab.toLowerCase() !== "home" && (
          <input type="hidden" name="tab" value={profileTab.toLowerCase()} />
        )}
        <div className="min-w-[200px] flex-[2]">
          <label className="block text-xs text-broker-muted">Cari artikel</label>
          <input
            type="search"
            name="aQ"
            defaultValue={q}
            placeholder="Judul, slug, ringkasan…"
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
            maxLength={120}
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs text-broker-muted">Per halaman</label>
          <select
            name="aPerPage"
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
            href={buildProfilArticleListHref(profileTab, {})}
            className="rounded-lg border border-broker-border px-4 py-2 text-sm text-broker-muted hover:bg-broker-surface/50"
          >
            Reset
          </Link>
        </div>
      </form>

      <p className="mb-3 text-xs text-broker-muted">
        {total === 0 ? (
          q ? (
            <>Tidak ada artikel yang cocok dengan pencarian.</>
          ) : (
            <>Belum ada pengajuan artikel.</>
          )
        ) : (
          <>
            Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari{" "}
            {total.toLocaleString("id-ID")} artikel
            {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
          </>
        )}
      </p>

      <ul className="space-y-2 text-sm">
        {articles.map((a) => {
          const published = a.status === "PUBLISHED";
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-broker-border px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                {published ? (
                  <Link
                    href={`/artikel/${encodeURIComponent(a.slug)}`}
                    className="text-white hover:text-broker-accent hover:underline"
                  >
                    {a.title}
                  </Link>
                ) : (
                  <span className="text-white">{a.title}</span>
                )}
              </span>
              <span className="shrink-0 text-broker-muted">{a.status}</span>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Pagination artikel">
          <Link
            href={buildProfilArticleListHref(profileTab, { ...base, page: prev })}
            className={`rounded-lg border border-broker-border px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-broker-muted hover:bg-broker-surface/50"
            }`}
          >
            Sebelumnya
          </Link>
          <Link
            href={buildProfilArticleListHref(profileTab, { ...base, page: next })}
            className={`rounded-lg border border-broker-border px-3 py-1.5 ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "text-broker-muted hover:bg-broker-surface/50"
            }`}
          >
            Berikutnya
          </Link>
        </nav>
      )}
    </section>
  );
}
