"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
      className="shrink-0 text-[11px] font-medium text-red-400/80 hover:text-red-300 hover:underline disabled:opacity-50"
    >
      {busy ? "…" : "Hapus"}
    </button>
  );
}
