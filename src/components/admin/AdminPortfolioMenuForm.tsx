"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminPortfolioMenuRow = {
  tabKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
};

const HELP: Record<string, string> = {
  dashboard: "Halaman statistik agregat per akun MetaTrader.",
  summary: "Ringkasan angka periode; token EA dikelola di halaman Dashboard portofolio.",
  mt_linked_logins: "Daftar nomor login terhubung di bawah blok Portofolio (desktop).",
  journal: "Jurnal trading member.",
  trade_log: "Tabel deal dari EA.",
  playbook: "Playbook / catatan strategi.",
  community_accounts: "Komunitas: daftar akun publikasi.",
  community_following: "Komunitas: akun yang di-copy.",
  community_my_followers: "Komunitas: daftar member yang Copy / Ikuti akun Anda.",
  community_publish: "Komunitas: pengaturan publikasi Copy / Ikuti.",
};

export function AdminPortfolioMenuForm({ initialItems }: { initialItems: AdminPortfolioMenuRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminPortfolioMenuRow[]>(() =>
    [...initialItems].sort((a, b) => a.sortOrder - b.sortOrder || a.tabKey.localeCompare(b.tabKey)),
  );
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function updateRow(tabKey: string, patch: Partial<AdminPortfolioMenuRow>) {
    setRows((prev) => prev.map((r) => (r.tabKey === tabKey ? { ...r, ...patch } : r)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setSaving(true);
    const res = await fetch("/api/admin/portfolio-menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: rows }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      return;
    }
    setMsg("Menu portofolio & komunitas disimpan. Sidebar member akan memuat ulang setelah navigasi.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 font-medium">Kunci</th>
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Urutan</th>
              <th className="px-3 py-2 font-medium">Aktif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tabKey} className="border-b border-gray-100">
                <td className="px-3 py-2 align-top">
                  <span className="font-mono text-xs text-gray-500">{r.tabKey}</span>
                  {HELP[r.tabKey] ? (
                    <p className="mt-1 max-w-xs text-xs text-gray-500">{HELP[r.tabKey]}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    className="w-full min-w-[10rem] rounded border border-gray-300 px-2 py-1.5 text-sm"
                    value={r.label}
                    onChange={(e) => updateRow(r.tabKey, { label: e.target.value })}
                    maxLength={80}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm"
                    value={r.sortOrder}
                    onChange={(e) =>
                      updateRow(r.tabKey, { sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => updateRow(r.tabKey, { enabled: e.target.checked })}
                    disabled={r.tabKey === "dashboard"}
                    className="h-4 w-4"
                    title="Dashboard tidak boleh dimatikan"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
      >
        {saving ? "Menyimpan…" : "Simpan menu portofolio"}
      </button>
    </form>
  );
}
