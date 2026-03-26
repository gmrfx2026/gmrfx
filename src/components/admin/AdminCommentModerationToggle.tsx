"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCommentModerationToggle({ id, initialHidden }: { id: string; initialHidden: boolean }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/admin/comment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, hidden: !hidden }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(typeof j.error === "string" ? j.error : "Gagal memperbarui");
      return;
    }
    setHidden((h) => !h);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={toggle}
      className={`rounded px-3 py-1 text-xs font-medium text-white disabled:opacity-50 ${
        hidden ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"
      }`}
    >
      {loading ? "…" : hidden ? "Tampilkan" : "Sembunyikan"}
    </button>
  );
}
