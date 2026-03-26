"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { useToast } from "@/components/ToastProvider";

export function DeleteStatusCommentButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Hapus komentar ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/status/comment/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal menghapus komentar.", "err");
        return;
      }
      show("Komentar dihapus.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onDelete()}
      title={busy ? "Menghapus…" : "Hapus komentar"}
      aria-label={busy ? "Menghapus komentar" : "Hapus komentar"}
      className="shrink-0 rounded-md p-1 text-red-400/85 transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
    >
      {busy ? (
        <span className="inline-block h-3.5 w-3.5 animate-pulse rounded border border-current opacity-70" />
      ) : (
        <TrashIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
