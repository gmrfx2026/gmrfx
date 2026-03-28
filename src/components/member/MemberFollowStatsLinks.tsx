"use client";

import Link from "next/link";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { SmallUserAvatar } from "@/components/SmallUserAvatar";

type ListType = "followers" | "following";

type Row = {
  id: string;
  name: string | null;
  image: string | null;
  memberSlug: string | null;
};

type ApiPayload = {
  items: Row[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  error?: string;
};

function profileHref(row: Row): string {
  if (row.memberSlug) return `/${row.memberSlug}`;
  return `/member/${row.id}`;
}

export function MemberFollowStatsLinks({
  memberUserId,
  followerCount,
  followingCount,
  className,
}: {
  memberUserId: string;
  followerCount: number;
  followingCount: number;
  /** Mis. `justify-center` di kartu profil dashboard. */
  className?: string;
}) {
  const [open, setOpen] = useState<ListType | null>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(
    async (type: ListType, pageNum: number, append: boolean) => {
      setLoading(true);
      setErr(null);
      try {
        const u = new URL("/api/member/follow/list", window.location.origin);
        u.searchParams.set("userId", memberUserId);
        u.searchParams.set("type", type);
        u.searchParams.set("page", String(pageNum));
        const res = await fetch(u.toString(), { credentials: "same-origin" });
        const j = (await res.json()) as ApiPayload & { error?: string };
        if (!res.ok) {
          setErr(j.error ?? "Gagal memuat daftar.");
          if (!append) setRows([]);
          return;
        }
        setTotal(j.total);
        setHasMore(j.hasMore);
        setRows((prev) => (append ? [...prev, ...j.items] : j.items));
      } catch {
        setErr("Gagal memuat daftar (jaringan).");
        if (!append) setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [memberUserId]
  );

  useEffect(() => {
    if (!open) {
      setRows([]);
      setPage(1);
      setErr(null);
      setTotal(0);
      setHasMore(false);
      return;
    }
    setPage(1);
    void load(open, 1, false);
  }, [open, load]);

  const handleLoadMore = () => {
    if (!open || loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void load(open, next, true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const title = open === "followers" ? "Pengikut" : open === "following" ? "Mengikuti" : "";

  return (
    <>
      <p
        className={clsx(
          "mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-broker-muted",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setOpen("following")}
          className="inline-flex items-baseline gap-1 rounded-md text-left transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-broker-accent"
        >
          <span className="tabular-nums font-semibold text-white">{followingCount}</span>
          <span>mengikuti</span>
        </button>
        <span className="text-broker-muted/50" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={() => setOpen("followers")}
          className="inline-flex items-baseline gap-1 rounded-md text-left transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-broker-accent"
        >
          <span className="tabular-nums font-semibold text-white">{followerCount}</span>
          <span>pengikut</span>
        </button>
      </p>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="follow-list-title"
          onClick={() => setOpen(null)}
        >
          <div
            className="flex max-h-[min(85vh,32rem)] w-full max-w-md flex-col rounded-t-2xl border border-broker-border bg-[#13161a] shadow-2xl sm:max-h-[min(80vh,28rem)] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-broker-border/60 px-4 py-3 sm:px-5">
              <h2 id="follow-list-title" className="text-base font-semibold text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-broker-muted transition hover:bg-broker-surface/60 hover:text-white"
              >
                Tutup
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
              {loading && rows.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-broker-muted">Memuat…</p>
              ) : err ? (
                <p className="px-3 py-8 text-center text-sm text-red-400">{err}</p>
              ) : rows.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-broker-muted">
                  {open === "followers" ? "Belum ada pengikut." : "Belum mengikuti member lain."}
                </p>
              ) : (
                <ul className="divide-y divide-broker-border/40">
                  {rows.map((r) => (
                    <li key={`${open}-${r.id}`}>
                      <Link
                        href={profileHref(r)}
                        onClick={() => setOpen(null)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-broker-surface/50"
                      >
                        <SmallUserAvatar name={r.name} image={r.image} size="md" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                          {r.name ?? "Member"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {hasMore && !err && (
                <div className="px-3 pb-3 pt-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleLoadMore}
                    className="w-full rounded-lg border border-broker-border py-2 text-sm font-medium text-broker-accent transition hover:bg-broker-surface/40 disabled:opacity-50"
                  >
                    {loading ? "Memuat…" : `Muat lainnya (${rows.length} / ${total})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
