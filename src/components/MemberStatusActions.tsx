"use client";

import { useState } from "react";
import { MemberStatusCommentForm } from "@/components/MemberStatusCommentForm";
import { MemberStatusLikeButton } from "@/components/MemberStatusLikeButton";

/** Baris Suka + Komentar; form komentar dibuka setelah klik Komentar. */
export function MemberStatusActions({
  statusId,
  initialCount,
  initialLiked,
}: {
  statusId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [commentOpen, setCommentOpen] = useState(false);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-broker-border/40 pt-3">
        <MemberStatusLikeButton
          statusId={statusId}
          initialCount={initialCount}
          initialLiked={initialLiked}
        />
        <button
          type="button"
          onClick={() => setCommentOpen((v) => !v)}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
            commentOpen
              ? "bg-broker-surface/80 text-broker-accent ring-1 ring-broker-accent/35"
              : "border border-broker-border/80 text-broker-muted hover:border-broker-accent/50 hover:text-white",
          ].join(" ")}
          aria-expanded={commentOpen}
        >
          Komentar
        </button>
      </div>

      {commentOpen && (
        <div className="mt-4 rounded-xl border border-broker-border/60 bg-broker-bg/40 p-3">
          <MemberStatusCommentForm
            statusId={statusId}
            compact
            onSuccess={() => setCommentOpen(false)}
          />
        </div>
      )}
    </>
  );
}
