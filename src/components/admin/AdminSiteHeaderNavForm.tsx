"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminSiteHeaderNavRow = {
  navKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
  href: string;
  visibilityNote: string;
};

export function AdminSiteHeaderNavForm({ initialItems }: { initialItems: AdminSiteHeaderNavRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminSiteHeaderNavRow[]>(() =>
    [...initialItems].sort((a, b) => a.sortOrder - b.sortOrder || a.navKey.localeCompare(b.navKey)),
  );
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function updateRow(navKey: string, patch: Partial<AdminSiteHeaderNavRow>) {
    setRows((prev) => prev.map((r) => (r.navKey === navKey ? { ...r, ...patch } : r)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setSaving(true);
    const res = await fetch("/api/admin/site-header-nav", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: rows.map(({ href: _h, visibilityNote: _v, ...rest }) => rest),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      return;
    }
    setMsg("Menu header disimpan.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 font-medium">Kunci</th>
              <th className="px-3 py-2 font-medium">URL</th>
              <th className="px-3 py-2 font-medium">Tampil untuk</th>
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Urutan</th>
              <th className="px-3 py-2 font-medium">Aktif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.navKey} className="border-b border-gray-100">
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.navKey}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.href}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{r.visibilityNote}</td>
                <td className="px-3 py-2">
                  <input
                    className="w-full min-w-[8rem] rounded border border-gray-300 px-2 py-1.5 text-sm"
                    value={r.label}
                    onChange={(e) => updateRow(r.navKey, { label: e.target.value })}
                    maxLength={80}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm"
                    value={r.sortOrder}
                    onChange={(e) =>
                      updateRow(r.navKey, { sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => updateRow(r.navKey, { enabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        <strong>Daftar/Login</strong> otomatis disembunyikan setelah pengguna masuk. <strong>Dashboard</strong>{" "}
        dan <strong>Admin</strong> hanya muncul sesuai aturan di kolom &quot;Tampil untuk&quot;. Minimal satu
        item &quot;Semua pengunjung&quot; harus tetap aktif.
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
      >
        {saving ? "Menyimpan…" : "Simpan menu header"}
      </button>
    </form>
  );
}
