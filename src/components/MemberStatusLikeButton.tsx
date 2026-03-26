"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function MemberStatusLikeButton({
  statusId,
  initialCount,
  initialLiked,
}: {
  statusId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/status/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal memperbarui suka.", "err");
        return;
      }
      setLiked(Boolean(j.liked));
      setCount(Number(j.count ?? 0));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3 border-t border-broker-border/40 pt-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition",
          liked
            ? "bg-broker-accent/20 text-broker-accent ring-1 ring-broker-accent/40"
            : "border border-broker-border/80 text-broker-muted hover:border-broker-accent/50 hover:text-white",
        ].join(" ")}
      >
        <span aria-hidden>{liked ? "♥" : "♡"}</span>
        <span>{liked ? "Disukai" : "Suka"}</span>
        {count > 0 && <span className="text-xs opacity-90">({count})</span>}
      </button>
    </div>
  );
}
