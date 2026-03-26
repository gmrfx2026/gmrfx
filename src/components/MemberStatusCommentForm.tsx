"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function MemberStatusCommentForm({ statusId }: { statusId: string }) {
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
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-2">
      <label className="text-xs text-broker-muted">Tulis komentar</label>
      <textarea
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
