"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { useToast } from "@/components/ToastProvider";

const PENDING_RETRY_SEC = 20;   // coba ulang setiap N detik saat TX masih pending
const PENDING_MAX_TRIES = 15;   // maksimum percobaan (~5 menit total)

type DepositRow = {
  id: string;
  txHash: string;
  network: string;
  amountUsdt: string;
  rateIdr: string;
  amountIdr: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  failReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

type ApiData = {
  adminAddress: string;
  network: string;
  usdtContract: string;
  balance: string;
  deposits: DepositRow[];
};

const STATUS_LABEL: Record<DepositRow["status"], string> = {
  PENDING: "Menunggu",
  VERIFIED: "Dikreditkan",
  FAILED: "Gagal",
};
const STATUS_COLOR: Record<DepositRow["status"], string> = {
  PENDING: "text-amber-400",
  VERIFIED: "text-emerald-400",
  FAILED: "text-red-400",
};

function fmtIdr(val: string | number) {
  return Number(val).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function shortHash(h: string) {
  return h.slice(0, 10) + "…" + h.slice(-8);
}

export function WalletUsdtDeposit() {
  const { show } = useToast();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [pendingCountdown, setPendingCountdown] = useState<number | null>(null);
  const pendingRetryRef = useRef<{ hash: string; tries: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/wallet/usdt-deposit", { credentials: "same-origin" });
      if (r.ok) setData((await r.json()) as ApiData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Bersihkan retry timer saat komponen unmount
  useEffect(() => {
    return () => {
      if (pendingRetryRef.current) clearTimeout(pendingRetryRef.current.timer);
    };
  }, []);

  function cancelPendingRetry() {
    if (pendingRetryRef.current) {
      clearTimeout(pendingRetryRef.current.timer);
      pendingRetryRef.current = null;
    }
    setPendingCountdown(null);
  }

  async function submitHash(hash: string, isAutoRetry = false): Promise<void> {
    setSubmitting(true);
    if (!isAutoRetry) cancelPendingRetry();
    try {
      const r = await fetch("/api/wallet/usdt-deposit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        amountUsdt?: number;
        amountIdr?: number;
        rateIdr?: number;
        error?: string;
        pending?: boolean;
      };

      if (!r.ok) {
        if (j.pending) {
          // TX masih menunggu konfirmasi jaringan — jadwalkan retry otomatis
          const prevTries = isAutoRetry ? (pendingRetryRef.current?.tries ?? 0) : 0;
          const nextTry = prevTries + 1;

          if (nextTry <= PENDING_MAX_TRIES) {
            show(
              `TX masih pending — cek ulang otomatis dalam ${PENDING_RETRY_SEC}s (percobaan ${nextTry}/${PENDING_MAX_TRIES})`,
              "warn",
            );

            // Hitung mundur di UI
            let secs = PENDING_RETRY_SEC;
            setPendingCountdown(secs);
            const countdown = window.setInterval(() => {
              secs -= 1;
              if (secs <= 0) {
                clearInterval(countdown);
              } else {
                setPendingCountdown(secs);
              }
            }, 1000);

            const timer = setTimeout(() => {
              clearInterval(countdown);
              setPendingCountdown(null);
              void submitHash(hash, true);
            }, PENDING_RETRY_SEC * 1000);

            if (pendingRetryRef.current) clearTimeout(pendingRetryRef.current.timer);
            pendingRetryRef.current = { hash, tries: nextTry, timer };
          } else {
            cancelPendingRetry();
            show(
              `TX masih belum dikonfirmasi setelah ${PENDING_MAX_TRIES} percobaan. Coba lagi secara manual setelah TX sukses di BSCScan.`,
              "err",
            );
          }
        } else {
          cancelPendingRetry();
          show(j.error ?? "Verifikasi gagal", "err");
        }
      } else {
        cancelPendingRetry();
        show(
          `Deposit dikonfirmasi! ${j.amountUsdt} USDT → Rp ${fmtIdr(j.amountIdr ?? 0)} (kurs ${fmtIdr(j.rateIdr ?? 0)}/USDT)`,
        );
        setTxHash("");
        await load();
      }
    } catch {
      show("Jaringan error", "err");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hash = txHash.trim();
    if (!hash) return;
    await submitHash(hash);
  }

  async function copyAddress() {
    if (!data?.adminAddress) return;
    try {
      await navigator.clipboard.writeText(data.adminAddress);
      show("Alamat disalin!");
    } catch {
      show("Gagal menyalin", "err");
    }
  }

  const qrUrl = data?.adminAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data.adminAddress)}`
    : null;

  return (
    <section className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg">Deposit USDT</h2>
        <p className="mt-0.5 text-sm text-broker-muted">
          Transfer USDT ke alamat di bawah, lalu masukkan TxHash untuk dikreditkan otomatis ke saldo IDR Anda.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-broker-muted">Memuat…</p>
      ) : !data?.adminAddress ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          Fitur deposit belum dikonfigurasi. Hubungi admin.
        </div>
      ) : (
        <>
          {/* Deposit address card */}
          <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-5">
            {/* Network badge */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                BSC (BEP-20) — USDT
              </span>
              <span className="text-xs text-broker-muted">Minimum deposit: 1 USDT</span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* QR code */}
              {qrUrl && (
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR alamat deposit"
                    width={160}
                    height={160}
                    className="rounded-xl border border-broker-border/60 bg-white p-1"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-broker-muted">Alamat deposit admin (BSC)</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code
                      className={`min-w-0 break-all rounded-lg bg-broker-bg/50 px-3 py-2 text-xs font-mono text-broker-gold ${
                        showFull ? "" : "truncate"
                      }`}
                      style={{ maxWidth: showFull ? "none" : "260px" }}
                    >
                      {data.adminAddress}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowFull((v) => !v)}
                      className="shrink-0 text-[10px] text-broker-muted hover:text-white"
                    >
                      {showFull ? "↑" : "…"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyAddress()}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-broker-accent/40 bg-broker-accent/10 px-3 py-1.5 text-xs font-semibold text-broker-accent hover:bg-broker-accent/20 transition"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Salin alamat
                  </button>
                </div>

                {/* Warning */}
                <div className="rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-2 text-xs text-red-300 space-y-0.5">
                  <p className="font-semibold">⚠ Penting:</p>
                  <p>• Hanya kirim <strong>USDT</strong> di jaringan <strong>BSC (BEP-20)</strong>.</p>
                  <p>• Mengirim token lain atau jaringan lain akan <strong>hilang permanen</strong>.</p>
                  <p>• Konfirmasi di wallet Trust Wallet: jaringan = <strong>BNB Smart Chain</strong>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit TxHash */}
          <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-5">
            <h3 className="text-sm font-semibold text-white">Konfirmasi deposit</h3>
            <p className="mt-1 text-xs text-broker-muted">
              Setelah transfer berhasil, salin <strong className="text-white">TxHash / Transaction Hash</strong> dari
              Trust Wallet atau BSCScan, lalu tempel di bawah.
            </p>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1">
                <span className="text-xs text-broker-muted">TxHash transaksi</span>
                <input
                  ref={inputRef}
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x…"
                  maxLength={66}
                  className="mt-1 w-full rounded-xl border border-broker-border bg-broker-bg/30 px-3 py-2 font-mono text-xs text-white placeholder:text-broker-muted/40"
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !txHash.trim()}
                className="shrink-0 rounded-xl bg-broker-accent px-5 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50 transition"
              >
                {submitting ? "Verifikasi…" : "Konfirmasi"}
              </button>
            </form>
            {pendingCountdown !== null ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                TX masih pending — cek ulang otomatis dalam{" "}
                <strong className="tabular-nums">{pendingCountdown}s</strong>
                <button
                  type="button"
                  onClick={cancelPendingRetry}
                  className="ml-auto text-amber-400/60 hover:text-amber-200"
                  title="Batalkan retry otomatis"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-broker-muted">
                Verifikasi otomatis via BSCScan. Jika TX masih pending saat submit, sistem akan mengecek ulang
                otomatis setiap {PENDING_RETRY_SEC} detik hingga dikonfirmasi.
              </p>
            )}
          </div>

          {/* Deposit history */}
          {data.deposits.length > 0 && (
            <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Riwayat deposit USDT</h3>
              <div className="space-y-2">
                {data.deposits.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-1 rounded-lg border border-broker-border/50 bg-broker-bg/25 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${STATUS_COLOR[d.status]}`}>
                          {STATUS_LABEL[d.status]}
                        </span>
                        <a
                          href={`https://bscscan.com/tx/${d.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-broker-muted hover:text-broker-accent"
                          title={d.txHash}
                        >
                          {shortHash(d.txHash)}
                        </a>
                      </div>
                      {d.status === "FAILED" && d.failReason && (
                        <p className="text-red-400/80">{d.failReason}</p>
                      )}
                    </div>
                    <div className="text-right text-broker-muted">
                      {d.status === "VERIFIED" && (
                        <>
                          <p className="font-semibold text-white">
                            +Rp {fmtIdr(d.amountIdr)}
                          </p>
                          <p>
                            {parseFloat(d.amountUsdt).toFixed(2)} USDT @ {fmtIdr(d.rateIdr)}
                          </p>
                        </>
                      )}
                      <p className="text-[10px]">
                        {formatJakarta(d.createdAt, { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to get TxHash guide */}
          <div className="rounded-xl border border-broker-border/40 bg-broker-surface/20 px-4 py-3 text-xs text-broker-muted space-y-1">
            <p className="font-semibold text-white/80">Cara mendapatkan TxHash di Trust Wallet:</p>
            <p>1. Buka Trust Wallet → pilih token USDT (BNB Smart Chain).</p>
            <p>2. Pilih transaksi yang baru Anda kirim → klik <strong className="text-white">Lihat di Explorer</strong>.</p>
            <p>3. Di halaman BSCScan, salin hash panjang di bagian atas (diawali <code className="text-emerald-400">0x</code>).</p>
            <p>4. Tempel di kolom TxHash di atas → klik <strong className="text-white">Konfirmasi</strong>.</p>
          </div>
        </>
      )}
    </section>
  );
}
