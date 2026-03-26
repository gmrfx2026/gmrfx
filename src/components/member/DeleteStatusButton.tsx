"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { useToast } from "@/components/ToastProvider";

export function DeleteStatusButton({ statusId }: { statusId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Hapus status ini beserta komentar dan suka?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/status/${encodeURIComponent(statusId)}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal menghapus status.", "err");
        return;
      }
      show("Status dihapus.");
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
      title={busy ? "Menghapus…" : "Hapus status"}
      aria-label={busy ? "Menghapus status" : "Hapus status"}
      className="shrink-0 rounded-md p-1.5 text-red-400/90 transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
    >
      {busy ? (
        <span className="inline-block h-4 w-4 animate-pulse rounded border border-current opacity-70" />
      ) : (
        <TrashIcon className="h-4 w-4" />
      )}
    </button>
  );
}
