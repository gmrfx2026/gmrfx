"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Config = {
  withdrawEnabled: boolean;
  bankEnabled: boolean;
  usdtEnabled: boolean;
  minAmountIdr: number;
  maxAmountIdr: number;
  bankFeeIdr: number;
  usdtFeeIdr: number;
  usdtNetwork: string;
  processingNote: string | null;
};

function fmtIDR(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

function SwitchRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-gray-300"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function WithdrawConfigForm({ initial }: { initial: Config }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<Config>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Config>(k: K, v: Config[K]) { setCfg(c => ({ ...c, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setBusy(true);
    const res = await fetch("/api/admin/withdraw-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: "Pengaturan berhasil disimpan." }); router.refresh(); }
    else setMsg({ ok: false, text: "Gagal menyimpan pengaturan." });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Master switches */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-gray-800">Status Fitur</h3>
        <SwitchRow label="Penarikan diaktifkan" desc="Master switch — matikan untuk sementara menutup semua penarikan." value={cfg.withdrawEnabled} onChange={v => set("withdrawEnabled", v)} />
        <SwitchRow label="Penarikan via Bank" desc="Member bisa menarik saldo ke rekening bank." value={cfg.bankEnabled} onChange={v => set("bankEnabled", v)} />
        <SwitchRow label="Penarikan via USDT" desc="Member bisa menarik saldo ke dompet USDT." value={cfg.usdtEnabled} onChange={v => set("usdtEnabled", v)} />
      </div>

      {/* Limit & Fee */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-800">Limit &amp; Biaya</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Minimal Penarikan (IDR)</label>
            <input type="number" min={0} value={cfg.minAmountIdr} onChange={e => set("minAmountIdr", Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="mt-1 text-xs text-gray-400">{fmtIDR(cfg.minAmountIdr)}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Maksimal Penarikan (IDR) — 0 = tidak terbatas</label>
            <input type="number" min={0} value={cfg.maxAmountIdr} onChange={e => set("maxAmountIdr", Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="mt-1 text-xs text-gray-400">{cfg.maxAmountIdr > 0 ? fmtIDR(cfg.maxAmountIdr) : "Tidak terbatas"}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Biaya Admin Bank (IDR flat per pengajuan)</label>
            <input type="number" min={0} value={cfg.bankFeeIdr} onChange={e => set("bankFeeIdr", Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="mt-1 text-xs text-gray-400">{cfg.bankFeeIdr > 0 ? fmtIDR(cfg.bankFeeIdr) : "Gratis"}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Biaya Admin USDT (IDR flat per pengajuan)</label>
            <input type="number" min={0} value={cfg.usdtFeeIdr} onChange={e => set("usdtFeeIdr", Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="mt-1 text-xs text-gray-400">{cfg.usdtFeeIdr > 0 ? fmtIDR(cfg.usdtFeeIdr) : "Gratis"}</p>
          </div>
        </div>
      </div>

      {/* USDT Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-800">Info USDT</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Jaringan (ditampilkan ke member)</label>
            <input type="text" maxLength={50} value={cfg.usdtNetwork} onChange={e => set("usdtNetwork", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Catatan / Syarat Penarikan (opsional)</label>
            <textarea rows={3} maxLength={500} value={cfg.processingNote ?? ""} onChange={e => set("processingNote", e.target.value || null)} placeholder="Contoh: Penarikan diproses dalam 1×24 jam kerja. Pastikan alamat dompet sudah benar." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            <p className="mt-1 text-xs text-gray-400">{(cfg.processingNote ?? "").length}/500 karakter</p>
          </div>
        </div>
      </div>

      {msg && <p className={`text-sm font-medium ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">{busy ? "Menyimpan…" : "Simpan Pengaturan"}</button>
    </form>
  );
}
