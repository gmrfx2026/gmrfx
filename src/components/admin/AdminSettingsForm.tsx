"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSettingsForm({
  initialFee,
  initialArticleCommentsPerPage,
  initialMemberTimelinePerPage,
  initialMemberStatusCommentsPerPage,
  initialHomeMemberTickerVisible,
}: {
  initialFee: string;
  initialArticleCommentsPerPage: string;
  initialMemberTimelinePerPage: string;
  initialMemberStatusCommentsPerPage: string;
  initialHomeMemberTickerVisible: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState(initialFee);
  const [commentsPer, setCommentsPer] = useState(initialArticleCommentsPerPage);
  const [timelinePer, setTimelinePer] = useState(initialMemberTimelinePerPage);
  const [statusCommentsPer, setStatusCommentsPer] = useState(initialMemberStatusCommentsPerPage);
  const [memberTickerVisible, setMemberTickerVisible] = useState(initialHomeMemberTickerVisible);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformFeePercent: v,
        articleCommentsPerPage: commentsPer,
        memberTimelinePerPage: timelinePer,
        memberStatusCommentsPerPage: statusCommentsPer,
        homeMemberTickerVisible: memberTickerVisible,
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
      <label className="block text-sm">
        <span className="text-gray-600">Linimasa member — status per halaman (5–50)</span>
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={timelinePer}
          onChange={(e) => setTimelinePer(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Halaman publik profil member (`/nama-member`): jumlah status yang ditampilkan per halaman.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={memberTickerVisible}
          onChange={(e) => setMemberTickerVisible(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>
          <span className="font-medium text-gray-800">Tampilkan strip &quot;Member baru&quot; di beranda</span>
          <span className="mt-1 block text-xs text-gray-500">
            Bilah horizontal di bawah hero yang menampilkan nama member terbaru. Nonaktifkan jika ingin
            menyembunyikannya.
          </span>
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Linimasa member — komentar per status per halaman (5–50)</span>
        <input
          type="number"
          min={5}
          max={50}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={statusCommentsPer}
          onChange={(e) => setStatusCommentsPer(e.target.value)}
        />
        <span className="mt-1 block text-xs text-gray-500">
          Di bawah setiap status: komentar dipecah per halaman (parameter query per status).
        </span>
      </label>
      <button type="submit" className="rounded bg-green-600 px-4 py-2 text-sm text-white">
        Simpan
      </button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
