"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminMemberMenuRow = {
  tabKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
};

export function AdminMemberMenuForm({ initialItems }: { initialItems: AdminMemberMenuRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminMemberMenuRow[]>(() =>
    [...initialItems].sort((a, b) => a.sortOrder - b.sortOrder || a.tabKey.localeCompare(b.tabKey)),
  );
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function updateRow(tabKey: string, patch: Partial<AdminMemberMenuRow>) {
    setRows((prev) => prev.map((r) => (r.tabKey === tabKey ? { ...r, ...patch } : r)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setSaving(true);
    const res = await fetch("/api/admin/member-menu", {
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
    setMsg("Menu member disimpan.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 font-medium">Tab (kunci)</th>
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Urutan</th>
              <th className="px-3 py-2 font-medium">Aktif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tabKey} className="border-b border-gray-100">
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.tabKey}</td>
                <td className="px-3 py-2">
                  <input
                    className="w-full min-w-[10rem] rounded border border-gray-300 px-2 py-1.5 text-sm"
                    value={r.label}
                    onChange={(e) => updateRow(r.tabKey, { label: e.target.value })}
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
                      updateRow(r.tabKey, { sortOrder: Number(e.target.value) || 0 })
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => updateRow(r.tabKey, { enabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Link menu selalu mengarah ke <code className="rounded bg-gray-100 px-1">/profil?tab=…</code> sesuai
        kunci tab. Hanya label, urutan, dan tampilan aktif yang dapat diubah.
      </p>
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Menyimpan…" : "Simpan menu"}
      </button>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
