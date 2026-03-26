"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function MemberStatusCommentForm({
  statusId,
  compact = false,
  onSuccess,
}: {
  statusId: string;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/status/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId, content: text }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const m = j.error ?? "Gagal";
      setErr(m);
      show(m, "err");
      return;
    }
    setText("");
    show("Komentar terkirim");
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-2 ${compact ? "" : "mt-6"}`}>
      <label className={compact ? "sr-only" : "text-xs text-broker-muted"} htmlFor={`comment-${statusId}`}>
        Tulis komentar
      </label>
      <textarea
        id={`comment-${statusId}`}
        className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1500}
        required
      />
      {err && <p className="text-sm text-broker-danger">{err}</p>}
      <button type="submit" className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg">
        Kirim
      </button>
    </form>
  );
}
