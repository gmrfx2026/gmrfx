"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function MemberStatusCommentLikeButton({
  commentId,
  initialCount,
  initialLiked,
}: {
  commentId: string;
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
      const res = await fetch("/api/status/comment/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
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
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition",
        liked
          ? "text-broker-accent"
          : "text-broker-muted/80 hover:text-broker-accent/90",
      ].join(" ")}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{liked ? "Disukai" : "Suka"}</span>
      {count > 0 && <span className="opacity-90">({count})</span>}
    </button>
  );
}
