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
    "w-full rounded-xl border border-broker-border/90 bg-broker-bg/90 px-3 py-3 text-sm text-white shadow-inner placeholder:text-broker-muted/70 focus:border-broker-accent/50 focus:outline-none focus:ring-2 focus:ring-broker-accent/20 sm:px-4";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-broker-border/70 bg-gradient-to-b from-broker-surface/50 to-broker-surface/30 p-3.5 shadow-sm ring-1 ring-white/5 sm:p-5"
    >
      <label className="sr-only" htmlFor="member-status-composer">
        Tulis status
      </label>
      <textarea
        id="member-status-composer"
        className={`${input} min-h-[5.5rem] resize-y sm:min-h-[5.75rem]`}
        rows={3}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Apa yang Anda pikirkan?"
        disabled={saving}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs tabular-nums text-broker-muted">{text.length}/500</span>
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="min-h-[44px] w-full shrink-0 rounded-xl bg-broker-accent px-5 py-2.5 text-sm font-semibold text-broker-bg transition hover:brightness-110 disabled:opacity-50 sm:min-h-0 sm:w-auto"
        >
          {saving ? "Mengirim…" : "Publikasikan"}
        </button>
      </div>
    </form>
  );
}
