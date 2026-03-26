"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSettingsForm({
  initialFee,
  initialArticleCommentsPerPage,
}: {
  initialFee: string;
  initialArticleCommentsPerPage: string;
}) {
  const router = useRouter();
  const [v, setV] = useState(initialFee);
  const [commentsPer, setCommentsPer] = useState(initialArticleCommentsPerPage);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformFeePercent: v,
        articleCommentsPerPage: commentsPer,
      }),
    });
    setMsg(res.ok ? "Disimpan." : "Gagal");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <label className="block text-sm">
        <span className="text-gray-600">Platform fee (%)</span>
        <input
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Komentar artikel per halaman (5–50)</span>
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={commentsPer}
          onChange={(e) => setCommentsPer(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Dipakai di halaman publik artikel; pagination muncul jika komentar lebih dari nilai ini.
        </span>
      </label>
      <button type="submit" className="rounded bg-green-600 px-4 py-2 text-sm text-white">
        Simpan
      </button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
