"use client";

import { useState, useEffect, useCallback } from "react";

type WithdrawConfig = {
  withdrawEnabled: boolean; bankEnabled: boolean; usdtEnabled: boolean;
  minAmountIdr: number; maxAmountIdr: number;
  bankFeeIdr: number; usdtFeeIdr: number;
  usdtNetwork: string; processingNote: string | null;
};
type WithdrawReq = {
  id: string; amountIdr: number; method: "BANK" | "USDT"; status: string;
  bankName: string | null; bankAccountNumber: string | null; bankAccountHolder: string | null;
  usdtAddress: string | null; adminNote: string | null; createdAt: string; processedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = { PENDING: "Menunggu", PROCESSING: "Diproses", APPROVED: "Selesai", REJECTED: "Ditolak" };
const STATUS_COLOR: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", PROCESSING: "bg-blue-100 text-blue-700", APPROVED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-600" };

function fmtIDR(n: number) { return "Rp " + Number(n).toLocaleString("id-ID"); }
function fmtDT(s: string) { return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export function ProfilWithdrawPanel({ walletBalance }: { walletBalance: number }) {
  const [config, setConfig] = useState<WithdrawConfig | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"BANK" | "USDT">("BANK");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<WithdrawReq[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    fetch("/api/wallet/withdraw").then(r => r.json()).then(d => { if (Array.isArray(d)) setHistory(d); }).finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    fetch("/api/wallet/withdraw-options").then(r => r.json()).then(d => { if (d?.config) setConfig(d.config); });
    loadHistory();
  }, [loadHistory]);

  const hasPending = history.some(h => h.status === "PENDING" || h.status === "PROCESSING");
  const minAmount = config?.minAmountIdr ?? 50000;
  const maxAmount = config?.maxAmountIdr ?? 0;
  const fee = method === "BANK" ? (config?.bankFeeIdr ?? 0) : (config?.usdtFeeIdr ?? 0);
  const amountNum = parseInt(amount.replace(/\D/g, ""), 10) || 0;
  const willReceive = Math.max(0, amountNum - fee);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (amountNum < minAmount) { setMsg({ ok: false, text: `Minimal penarikan ${fmtIDR(minAmount)}` }); return; }
    if (maxAmount > 0 && amountNum > maxAmount) { setMsg({ ok: false, text: `Maksimal penarikan ${fmtIDR(maxAmount)}` }); return; }
    if (amountNum > walletBalance) { setMsg({ ok: false, text: "Saldo tidak mencukupi" }); return; }
    setBusy(true);
    const res = await fetch("/api/wallet/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountIdr: amountNum, method }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: "Pengajuan berhasil! Admin akan memproses dalam 1×24 jam kerja." }); setAmount(""); loadHistory(); }
    else setMsg({ ok: false, text: json.error ?? "Gagal mengajukan penarikan" });
  }

  if (config && !config.withdrawEnabled) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
        Fitur penarikan saldo sedang tidak tersedia. Coba lagi nanti.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-bold text-gray-800">Ajukan Penarikan</h3>
        <p className="mb-4 text-xs text-gray-400">
          Saldo saat ini: <span className="font-semibold text-gray-700">{fmtIDR(walletBalance)}</span>.
          Minimal {fmtIDR(minAmount)}{maxAmount > 0 ? `, maksimal ${fmtIDR(maxAmount)}` : ""}.
          Saldo dikunci saat pengajuan dan dikembalikan jika ditolak.
        </p>
        {config?.processingNote && (
          <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">{config.processingNote}</div>
        )}
        {hasPending && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-700">
            Ada pengajuan yang sedang diproses. Tunggu hingga selesai sebelum mengajukan yang baru.
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jumlah (IDR)</label>
              <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} placeholder={`Min. ${fmtIDR(minAmount)}`} disabled={hasPending} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50 disabled:text-gray-400" />
              {amountNum > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {fmtIDR(amountNum)}{fee > 0 && <> — biaya admin {fmtIDR(fee)} = diterima <span className="font-semibold text-gray-600">{fmtIDR(willReceive)}</span></>}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Metode</label>
              <div className="flex gap-2">
                {(["BANK", "USDT"] as const).filter(m => m === "BANK" ? config?.bankEnabled !== false : config?.usdtEnabled !== false).map(m => (
                  <button key={m} type="button" onClick={() => setMethod(m)} disabled={hasPending} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${method === m ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                    {m === "BANK" ? "🏦 Bank" : `💎 USDT (${config?.usdtNetwork ?? "BSC"})`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {msg && <p className={`text-sm font-medium ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>}
          <button type="submit" disabled={busy || hasPending} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">{busy ? "Mengajukan…" : "Ajukan Penarikan"}</button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-800">Riwayat Penarikan</h3>
        {loadingHistory ? <p className="text-sm text-gray-400">Memuat…</p> : history.length === 0 ? <p className="text-sm text-gray-400">Belum ada pengajuan penarikan.</p> : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{fmtIDR(h.amountIdr)}</p>
                    <p className="text-xs text-gray-500">{h.method === "BANK" ? `${h.bankName} · ${h.bankAccountNumber} · ${h.bankAccountHolder}` : `USDT · ${h.usdtAddress}`}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{fmtDT(h.createdAt)}</p>
                    {h.adminNote && <p className="mt-1 text-xs text-gray-500 italic">{h.adminNote}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[h.status] ?? ""}`}>{STATUS_LABEL[h.status] ?? h.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
