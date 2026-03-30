"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HomeNewsItem, HomeNewsScope } from "@prisma/client";

function scopeLabel(s: HomeNewsScope) {
  return s === "DOMESTIC" ? "DN" : "INT";
}

export function AdminHomeNewsRow({
  item,
  authorLabel,
  authorHref,
}: {
  item: HomeNewsItem;
  authorLabel: string;
  authorHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Hapus berita ini?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/home-news?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
      <div className="min-w-0 flex-1">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
          {scopeLabel(item.scope)}
        </span>
        <p className="mt-1 font-medium text-gray-900">{item.title}</p>
        <p className="truncate text-xs text-gray-500">{item.sourceUrl ?? item.slug}</p>
        <p className="mt-0.5 text-xs text-gray-600">
          Penulis:{" "}
          <a href={authorHref} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {authorLabel}
          </a>
          {item.authorId ? " (member)" : " (default)"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <a
          href={`/berita/${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
        >
          Lihat
        </a>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="rounded border border-red-200 px-3 py-1 text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}
