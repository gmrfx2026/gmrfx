"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Link = {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
  sortOrder: number;
  active: boolean;
};

function ToggleBtn({ linkId, active }: { linkId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/affiliate-links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${active ? "bg-emerald-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function DeleteBtn({ linkId, linkName }: { linkId: string; linkName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm(`Hapus link "${linkName}"?`)) return;
    setBusy(true);
    await fetch(`/api/admin/affiliate-links/${linkId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={del} disabled={busy} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition">
      {busy ? "…" : "Hapus"}
    </button>
  );
}

function EditRow({ link, onClose }: { link: Link; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);
  const [logoUrl, setLogoUrl] = useState(link.logoUrl ?? "");
  const [sortOrder, setSortOrder] = useState(link.sortOrder);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    setBusy(true);
    const res = await fetch(`/api/admin/affiliate-links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, logoUrl: logoUrl || null, sortOrder }),
    });
    setBusy(false);
    if (res.ok) { onClose(); router.refresh(); }
    else setErr("Gagal menyimpan");
  }

  return (
    <tr className="bg-blue-50/60 border-b border-blue-100">
      <td colSpan={5} className="px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Broker</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL Afiliasi</label>
            <input value={url} onChange={e => setUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Urutan</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL Logo (opsional)</label>
            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={save} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition">
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">Batal</button>
        </div>
      </td>
    </tr>
  );
}

function AddLinkForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !url.trim()) { setErr("Nama dan URL wajib diisi"); return; }
    setBusy(true);
    const res = await fetch("/api/admin/affiliate-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, logoUrl: logoUrl || null, sortOrder, active: true }),
    });
    setBusy(false);
    if (res.ok) { onDone(); router.refresh(); }
    else setErr("Gagal menambah link");
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Tambah Link Baru</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Broker *</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Exness" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">URL Afiliasi *</label>
          <input required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Urutan</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1">URL Logo (opsional)</label>
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>
      </div>
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
          {busy ? "Menambah…" : "Tambah Link"}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">Batal</button>
      </div>
    </form>
  );
}

export function AffiliateLinkManager({ links }: { links: Link[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Daftar Link Broker</h2>
        {!adding && (
          <button onClick={() => setAdding(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition">
            + Tambah Link
          </button>
        )}
      </div>

      {adding && <AddLinkForm onDone={() => setAdding(false)} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Nama Broker", "URL Afiliasi", "Urutan", "Aktif", "Aksi"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.map(link => (
              <>
                <tr key={link.id} className={link.active ? "" : "bg-gray-50/60 opacity-60"}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{link.name}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-blue-600 hover:underline" title={link.url}>{link.url}</a>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{link.sortOrder}</td>
                  <td className="px-4 py-3">
                    <ToggleBtn linkId={link.id} active={link.active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingId(editingId === link.id ? null : link.id)}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition"
                      >
                        Edit
                      </button>
                      <DeleteBtn linkId={link.id} linkName={link.name} />
                    </div>
                  </td>
                </tr>
                {editingId === link.id && (
                  <EditRow key={`edit-${link.id}`} link={link} onClose={() => setEditingId(null)} />
                )}
              </>
            ))}
            {links.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada link broker. Klik "Tambah Link" di atas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
