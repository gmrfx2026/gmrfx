"use client";

import { useState, useEffect } from "react";

const BANKS = ["BCA", "BNI", "MANDIRI", "BRI"] as const;
type Bank = (typeof BANKS)[number];

type PaymentMethod = {
  bankName: Bank | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  usdtWithdrawAddress: string | null;
};

export function ProfilPaymentMethodForm() {
  const [data, setData] = useState<PaymentMethod>({
    bankName: null,
    bankAccountNumber: null,
    bankAccountHolder: null,
    usdtWithdrawAddress: null,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/payment-method")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const res = await fetch("/api/profile/payment-method", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setMsg({ ok: true, text: "Data pembayaran berhasil disimpan." });
    else {
      const errObj = json.error;
      const text = typeof errObj === "string" ? errObj : JSON.stringify(errObj);
      setMsg({ ok: false, text });
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Memuat…</div>;

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Bank */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gray-800">Rekening Bank</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank</label>
            <select
              value={data.bankName ?? ""}
              onChange={(e) => setData((d) => ({ ...d, bankName: (e.target.value as Bank) || null }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="">-- Pilih bank --</option>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor Rekening</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={30}
              value={data.bankAccountNumber ?? ""}
              onChange={(e) => setData((d) => ({ ...d, bankAccountNumber: e.target.value.replace(/\D/g, "") || null }))}
              placeholder="Contoh: 1234567890"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Pemilik Rekening</label>
            <input
              type="text"
              maxLength={100}
              value={data.bankAccountHolder ?? ""}
              onChange={(e) => setData((d) => ({ ...d, bankAccountHolder: e.target.value.toUpperCase() || null }))}
              placeholder="NAMA SESUAI BUKU TABUNGAN"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">Nama pemilik harus sama persis dengan nama di buku tabungan.</p>
      </div>

      {/* USDT */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-bold text-gray-800">Alamat Dompet USDT</h3>
        <p className="mb-3 text-xs text-gray-400">Jaringan BSC (BEP-20). Pastikan alamat sudah benar — kesalahan alamat tidak bisa dipulihkan.</p>
        <input
          type="text"
          maxLength={66}
          value={data.usdtWithdrawAddress ?? ""}
          onChange={(e) => setData((d) => ({ ...d, usdtWithdrawAddress: e.target.value.trim() || null }))}
          placeholder="0x..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {msg && (
        <p className={`text-sm font-medium ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
      >
        {busy ? "Menyimpan…" : "Simpan Data Pembayaran"}
      </button>
    </form>
  );
}
