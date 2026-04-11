"use client";

import { useEffect, useState, type RefObject } from "react";
import { SmallUserAvatar } from "@/components/SmallUserAvatar";

type Item = { memberSlug: string; name: string | null; image: string | null };

export function StatusCommentMentionPicker({
  open,
  onClose,
  onPick,
  searchInputRef,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (memberSlug: string, name: string) => void;
  searchInputRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        queueMicrotask(() => searchInputRef?.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, searchInputRef]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/member/following-mention-suggest?q=${encodeURIComponent(q)}`
          );
          const j = (await res.json().catch(() => ({}))) as { items?: Item[] };
          if (!cancelled && res.ok && Array.isArray(j.items)) {
            setItems(j.items);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, q]);

  if (!open) return null;

  return (
    <div className="mt-2 rounded-xl border border-broker-border/70 bg-broker-bg/95 p-2 shadow-lg">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama atau @slug…"
        className="mb-2 w-full rounded-lg border border-broker-border bg-broker-surface/40 px-2 py-1.5 text-sm text-white"
        autoFocus
      />
      {loading && <p className="px-1 text-xs text-broker-muted">Memuat…</p>}
      {!loading && items.length === 0 && (
        <p className="px-1 text-xs text-broker-muted">Tidak ada SeDulur yang cocok.</p>
      )}
      <ul className="max-h-48 space-y-1 overflow-y-auto">
        {items.map((u) => (
          <li key={u.memberSlug}>
            <button
              type="button"
              onClick={() => {
                onPick(u.memberSlug, u.name?.trim() || u.memberSlug);
                onClose();
                queueMicrotask(() => searchInputRef?.current?.focus());
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-broker-surface/50"
            >
              <SmallUserAvatar name={u.name} image={u.image} size="sm" />
              <span className="min-w-0 flex-1 truncate text-white">
                {u.name ?? u.memberSlug}{" "}
                <span className="text-broker-muted">@{u.memberSlug}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
