"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "publish" | "unpublish" | "delete";

export function MarketplaceActionButtons({
  itemId,
  itemTitle,
  published,
  apiBase,
}: {
  itemId: string;
  itemTitle: string;
  published: boolean;
  apiBase: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function doAction(action: Action) {
    if (action === "delete" && !confirm(`Hapus produk "${itemTitle}" secara permanen?`)) return;
    setBusy(action);
    const res = await fetch(`${apiBase}/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (res.ok) {
      if (action === "delete") setDeleted(true);
      router.refresh();
    } else {
      alert("Gagal: " + action);
    }
  }

  if (deleted) return <span className="text-xs text-red-400 italic">Dihapus</span>;

  return (
    <div className="flex items-center gap-1.5">
      {published ? (
        <button
          onClick={() => doAction("unpublish")}
          disabled={busy !== null}
          className="rounded-lg bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-yellow-400 disabled:opacity-50 transition"
        >
          {busy === "unpublish" ? "…" : "Sembunyikan"}
        </button>
      ) : (
        <button
          onClick={() => doAction("publish")}
          disabled={busy !== null}
          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
        >
          {busy === "publish" ? "…" : "Publikasikan"}
        </button>
      )}
      <button
        onClick={() => doAction("delete")}
        disabled={busy !== null}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition"
      >
        {busy === "delete" ? "…" : "Hapus"}
      </button>
    </div>
  );
}
