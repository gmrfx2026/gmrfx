"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

/** Kotak status di halaman publik member (pemilik profil saja), mirip composer Facebook. */
export function MemberStatusComposer() {
  const router = useRouter();
  const { show } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      show("Tulis status terlebih dahulu.", "err");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileStatus: trimmed }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal memublikasikan status.", "err");
        return;
      }
      setText("");
      show("Status dipublikasikan.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-xl border border-broker-border bg-broker-bg px-4 py-3 text-sm text-white placeholder:text-broker-muted/70";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-4 shadow-inner">
      <p className="text-sm font-medium text-white">Buat status</p>
      <p className="mt-1 text-xs text-broker-muted">
        Status Anda terlihat di halaman profil publik ini; member lain bisa berkomentar.
      </p>
      <label className="sr-only" htmlFor="member-status-composer">
        Tulis status
      </label>
      <textarea
        id="member-status-composer"
        className={`${input} mt-3 min-h-[88px] resize-y`}
        rows={3}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Apa yang Anda pikirkan?"
        disabled={saving}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-broker-muted">{text.length}/500</span>
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
        >
          {saving ? "Mengirim…" : "Publikasikan"}
        </button>
      </div>
    </form>
  );
}
