"use client";

import { useState, useEffect } from "react";

type BankOption = { id: string; code: string; fullName: string };
type PaymentMethod = {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  usdtWithdrawAddress: string | null;
};

type PaymentMethodResponse = PaymentMethod & {
  skipped?: boolean;
  reason?: string;
};

const input = "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white placeholder:text-broker-muted focus:outline-none focus:ring-1 focus:ring-broker-accent";
const label = "block text-xs font-medium text-broker-muted";
const card = "rounded-2xl border border-broker-border bg-broker-surface/50 p-5";

export function ProfilPaymentMethodForm() {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [usdtNetwork, setUsdtNetwork] = useState("BSC (BEP-20)");
  const [data, setData] = useState<PaymentMethod>({ bankName: null, bankAccountNumber: null, bankAccountHolder: null, usdtWithdrawAddress: null });
  const [busy, setBusy] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet/withdraw-options").then(r => r.json()),
      fetch("/api/profile/payment-method").then(r => r.json()),
    ]).then(([opts, pm]) => {
      const paymentMethod = (pm ?? {}) as Partial<PaymentMethodResponse>;
      if (Array.isArray(opts?.banks)) setBanks(opts.banks);
      if (opts?.config?.usdtNetwork) setUsdtNetwork(opts.config.usdtNetwork);
      if (paymentMethod.skipped && paymentMethod.reason === "payment-method-unavailable") {
        setMigrationRequired(true);
      }
      setData({
        bankName: paymentMethod.bankName ?? null,
        bankAccountNumber: paymentMethod.bankAccountNumber ?? null,
        bankAccountHolder: paymentMethod.bankAccountHolder ?? null,
        usdtWithdrawAddress: paymentMethod.usdtWithdrawAddress ?? null,
      });
    }).finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    if (migrationRequired) return;
    e.preventDefault(); setMsg(null); setBusy(true);
    const res = await fetch("/api/profile/payment-method", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setMsg({ ok: true, text: "Data pembayaran berhasil disimpan." });
    else { const errObj = json.error; setMsg({ ok: false, text: typeof errObj === "string" ? errObj : JSON.stringify(errObj) }); }
  }

  if (loading) return <div className="text-sm text-broker-muted">Memuat…</div>;

  return (
    <form onSubmit={save} className="space-y-5">
      {migrationRequired && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <p className="font-semibold text-amber-300">Data pembayaran belum aktif di server ini</p>
          <p className="mt-1 text-amber-200/90">
            Administrator perlu menjalankan migrasi Prisma yang menambah kolom rekening dan USDT di tabel User
            (misalnya migrasi 20260404030000_withdraw_request), lalu deploy ulang bila perlu. Form di bawah
            dinonaktifkan sampai migrasi selesai.
          </p>
        </div>
      )}

      {/* Bank */}
      <div className={card}>
        <h3 className="mb-4 text-sm font-semibold text-white">Rekening Bank</h3>
        {banks.length === 0 ? (
          <p className="text-sm text-broker-muted">Belum ada bank tersedia. Hubungi administrator.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label}>Bank</label>
              <select
                disabled={migrationRequired}
                value={data.bankName ?? ""}
                onChange={e => setData(d => ({ ...d, bankName: e.target.value || null }))}
                className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-broker-accent"
              >
                <option value="" className="bg-broker-bg">-- Pilih bank --</option>
                {banks.map(b => <option key={b.id} value={b.code} className="bg-broker-bg">{b.code} — {b.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Nomor Rekening</label>
              <input
                disabled={migrationRequired}
                type="text" inputMode="numeric" maxLength={30}
                value={data.bankAccountNumber ?? ""}
                onChange={e => setData(d => ({ ...d, bankAccountNumber: e.target.value.replace(/\D/g, "") || null }))}
                placeholder="1234567890"
                className={input}
              />
            </div>
            <div>
              <label className={label}>Nama Pemilik Rekening</label>
              <input
                disabled={migrationRequired}
                type="text" maxLength={100}
                value={data.bankAccountHolder ?? ""}
                onChange={e => setData(d => ({ ...d, bankAccountHolder: e.target.value.toUpperCase() || null }))}
                placeholder="NAMA SESUAI BUKU TABUNGAN"
                className={`${input} uppercase`}
              />
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-broker-muted">Nama pemilik harus sama persis dengan nama di buku tabungan.</p>
      </div>

      {/* USDT */}
      <div className={card}>
        <h3 className="mb-1 text-sm font-semibold text-white">Alamat Dompet USDT</h3>
        <p className="mb-3 text-xs text-broker-muted">Jaringan {usdtNetwork}. Pastikan alamat sudah benar — kesalahan tidak bisa dipulihkan.</p>
        <input
          disabled={migrationRequired}
          type="text" maxLength={66}
          value={data.usdtWithdrawAddress ?? ""}
          onChange={e => setData(d => ({ ...d, usdtWithdrawAddress: e.target.value.trim() || null }))}
          placeholder="0x..."
          className={`${input} font-mono`}
        />
      </div>

      {msg && (
        <p className={`text-sm font-medium ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      <button
        type="submit" disabled={busy || migrationRequired}
        className="rounded-xl bg-broker-accent px-5 py-2.5 text-sm font-semibold text-broker-bg hover:opacity-90 disabled:opacity-50 transition"
      >
        {busy ? "Menyimpan…" : "Simpan Data Pembayaran"}
      </button>
    </form>
  );
}
