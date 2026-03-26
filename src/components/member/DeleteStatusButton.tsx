"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
      className="text-xs font-medium text-red-400/90 hover:text-red-300 hover:underline disabled:opacity-50"
    >
      {busy ? "Menghapus…" : "Hapus"}
    </button>
  );
}
