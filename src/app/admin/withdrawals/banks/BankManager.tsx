"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Bank = { id: string; code: string; fullName: string; active: boolean; sortOrder: number };

function Toggle({ bankId, active }: { bankId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/withdraw-banks/${bankId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    setBusy(false);
    router.refresh();
  }
  return (
    <button onClick={toggle} disabled={busy} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${active ? "bg-emerald-500" : "bg-gray-300"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${active ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function EditRow({ bank, onClose }: { bank: Bank; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState(bank.code);
  const [fullName, setFullName] = useState(bank.fullName);
  const [sortOrder, setSortOrder] = useState(bank.sortOrder);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true); setErr("");
    const res = await fetch(`/api/admin/withdraw-banks/${bank.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase(), fullName, sortOrder }) });
    setBusy(false);
    if (res.ok) { onClose(); router.refresh(); }
    else setErr("Gagal menyimpan");
  }
  return (
    <tr className="bg-blue-50/60">
      <td colSpan={5} className="px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Kode</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={20} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Urutan</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" /></div>
        </div>
        {err && <p className="mt-1.5 text-xs text-red-500">{err}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={save} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition">{busy ? "…" : "Simpan"}</button>
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
        </div>
      </td>
    </tr>
  );
}

function AddBankForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [sortOrder, setSortOrder] = useState(99);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!code.trim() || !fullName.trim()) { setErr("Kode dan nama wajib diisi"); return; }
    setBusy(true);
    const res = await fetch("/api/admin/withdraw-banks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase(), fullName, sortOrder, active: true }) });
    setBusy(false);
    if (res.ok) { onDone(); router.refresh(); }
    else { const j = await res.json().catch(() => ({})); setErr(j.error ?? "Gagal"); }
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Tambah Bank Baru</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Kode *</label>
          <input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={20} placeholder="CIMB" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-300" /></div>
        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap *</label>
          <input required value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} placeholder="CIMB Niaga" className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" /></div>
        <div><label className="block text-xs font-semibold text-gray-600 mb-1">Urutan</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" /></div>
      </div>
      {err && <p className="mt-1.5 text-xs text-red-500">{err}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">{busy ? "…" : "Tambah Bank"}</button>
        <button type="button" onClick={onDone} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Batal</button>
      </div>
    </form>
  );
}

export function BankManager({ banks }: { banks: Bank[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function del(id: string, name: string) {
    if (!confirm(`Hapus bank "${name}"?`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/withdraw-banks/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Daftar Bank</h2>
        {!adding && <button onClick={() => setAdding(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition">+ Tambah Bank</button>}
      </div>
      {adding && <AddBankForm onDone={() => setAdding(false)} />}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>{["Kode", "Nama Lengkap", "Urutan", "Aktif", "Aksi"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banks.map(bank => (
              <>
                <tr key={bank.id} className={bank.active ? "" : "bg-gray-50/60 opacity-60"}>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{bank.code}</td>
                  <td className="px-4 py-3 text-gray-700">{bank.fullName}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{bank.sortOrder}</td>
                  <td className="px-4 py-3"><Toggle bankId={bank.id} active={bank.active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingId(editingId === bank.id ? null : bank.id)} className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition">Edit</button>
                      <button onClick={() => del(bank.id, bank.code)} disabled={deletingId === bank.id} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition">{deletingId === bank.id ? "…" : "Hapus"}</button>
                    </div>
                  </td>
                </tr>
                {editingId === bank.id && <EditRow key={`edit-${bank.id}`} bank={bank} onClose={() => setEditingId(null)} />}
              </>
            ))}
            {banks.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada bank.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
