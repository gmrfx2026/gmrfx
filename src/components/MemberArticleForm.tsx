"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";

export function MemberArticleForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [html, setHtml] = useState("<p></p>");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/member/article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, excerpt, contentHtml: html }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Gagal mengirim");
      return;
    }
    router.push("/profil?tab=artikel");
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-surface px-3 py-2 text-sm text-white";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-broker-muted">Judul</label>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="text-xs text-broker-muted">Ringkasan</label>
        <input className={input} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-broker-muted">Isi artikel</label>
        <RichTextEditor value={html} onChange={setHtml} />
      </div>
      {err && <p className="text-sm text-broker-danger">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-broker-accent px-5 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
      >
        {loading ? "Mengirim…" : "Kirim untuk persetujuan admin"}
      </button>
    </form>
  );
}
