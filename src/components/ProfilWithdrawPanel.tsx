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
const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-400",
  PROCESSING: "text-blue-400",
  APPROVED: "text-emerald-400",
  REJECTED: "text-red-400",
};

const input = "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white placeholder:text-broker-muted focus:outline-none focus:ring-1 focus:ring-broker-accent disabled:opacity-40";
const card = "rounded-2xl border border-broker-border bg-broker-surface/50 p-5";

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
      <div className={`${card} border-red-500/30 bg-red-900/10`}>
        <p className="text-sm text-red-400">Fitur penarikan saldo sedang tidak tersedia. Coba lagi nanti.</p>
      </div>
    );
  }

  const availableMethods = (["BANK", "USDT"] as const).filter(
    m => m === "BANK" ? config?.bankEnabled !== false : config?.usdtEnabled !== false
  );

  return (
    <div className="space-y-5">
      {/* Form ajukan */}
      <div className={card}>
        <h3 className="mb-1 text-sm font-semibold text-white">Ajukan Penarikan</h3>
        <p className="mb-4 text-xs text-broker-muted">
          Saldo saat ini: <span className="font-semibold text-broker-accent">{fmtIDR(walletBalance)}</span>.
          Minimal {fmtIDR(minAmount)}{maxAmount > 0 ? `, maksimal ${fmtIDR(maxAmount)}` : ""}.
          Saldo dikunci saat pengajuan dan dikembalikan jika ditolak.
        </p>

        {config?.processingNote && (
          <div className="mb-4 rounded-xl border border-broker-border/60 bg-broker-bg/50 px-3 py-2.5 text-xs text-broker-muted">
            {config.processingNote}
          </div>
        )}

        {hasPending && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            Ada pengajuan yang sedang diproses. Tunggu hingga selesai sebelum mengajukan yang baru.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-broker-muted">Jumlah (IDR)</label>
              <input
                type="text" inputMode="numeric"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder={`Min. ${fmtIDR(minAmount)}`}
                disabled={hasPending}
                className={`${input} font-mono`}
              />
              {amountNum > 0 && (
                <p className="mt-1 text-xs text-broker-muted">
                  {fmtIDR(amountNum)}
                  {fee > 0 && <> &mdash; biaya {fmtIDR(fee)} = diterima <span className="text-emerald-400 font-semibold">{fmtIDR(willReceive)}</span></>}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-broker-muted">Metode</label>
              <div className="mt-1 flex gap-2">
                {availableMethods.map(m => (
                  <button
                    key={m} type="button"
                    onClick={() => setMethod(m)}
                    disabled={hasPending}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ${
                      method === m
                        ? "border-broker-accent bg-broker-accent/10 text-broker-accent"
                        : "border-broker-border text-broker-muted hover:border-broker-accent/40 hover:text-white"
                    }`}
                  >
                    {m === "BANK" ? "🏦 Bank" : `💎 USDT`}
                  </button>
                ))}
              </div>
              {method === "USDT" && config?.usdtNetwork && (
                <p className="mt-1 text-xs text-broker-muted">{config.usdtNetwork}</p>
              )}
            </div>
          </div>

          {msg && (
            <p className={`text-sm font-medium ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
          )}

          <button
            type="submit" disabled={busy || hasPending}
            className="rounded-xl bg-broker-accent px-5 py-2.5 text-sm font-semibold text-broker-bg hover:opacity-90 disabled:opacity-40 transition"
          >
            {busy ? "Mengajukan…" : "Ajukan Penarikan"}
          </button>
        </form>
      </div>

      {/* Riwayat */}
      <div className={card}>
        <h3 className="mb-3 text-sm font-semibold text-white">Riwayat Penarikan</h3>
        {loadingHistory ? (
          <p className="text-sm text-broker-muted">Memuat…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-broker-muted">Belum ada pengajuan penarikan.</p>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="rounded-xl border border-broker-border/60 bg-broker-bg/40 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{fmtIDR(h.amountIdr)}</p>
                    <p className="text-xs text-broker-muted">
                      {h.method === "BANK"
                        ? `${h.bankName} · ${h.bankAccountNumber} · ${h.bankAccountHolder}`
                        : `USDT · ${h.usdtAddress}`}
                    </p>
                    <p className="mt-0.5 text-xs text-broker-muted">{fmtDT(h.createdAt)}</p>
                    {h.adminNote && <p className="mt-1 text-xs text-broker-muted italic">{h.adminNote}</p>}
                  </div>
                  <span className={`text-xs font-semibold ${STATUS_COLOR[h.status] ?? "text-broker-muted"}`}>
                    {STATUS_LABEL[h.status] ?? h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
