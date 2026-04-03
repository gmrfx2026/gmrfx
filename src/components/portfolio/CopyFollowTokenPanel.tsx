"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  followId: string;
  tokenHint: string | null;
  issuedAt: Date | null;
};

export function CopyFollowTokenPanel({ followId, tokenHint, issuedAt }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function regen() {
    if (!confirm("Token lama akan langsung tidak berlaku. Lanjutkan?")) return;
    setErr(null);
    setLoading(true);
    setPlainToken(null);
    try {
      const r = await fetch("/api/community/copy-token-regen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followId }),
      });
      const j = (await r.json()) as { copyToken?: string; error?: string };
      if (!r.ok) { setErr(j.error ?? "Gagal"); return; }
      if (j.copyToken) setPlainToken(j.copyToken);
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  async function doCopy(t: string) {
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { /* ignore */ }
  }

  return (
    <div className="mt-3 rounded-xl border border-broker-border/60 bg-broker-bg/50 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold text-broker-accent hover:text-emerald-300 transition"
      >
        <span>Token EA CopyTrader</span>
        <span className="text-broker-muted">{open ? "▲ tutup" : "▼ buka"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Jika sudah ada plain token dari regen */}
          {plainToken ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-emerald-400">
                Token baru — simpan sekarang, tidak bisa dilihat lagi:
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-broker-surface/60 px-3 py-2 font-mono text-xs text-white break-all">
                <span className="flex-1 select-all">{plainToken}</span>
                <button
                  type="button"
                  onClick={() => void doCopy(plainToken)}
                  className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-700/50 hover:bg-emerald-700/80 text-emerald-200 transition"
                >
                  {copied ? "✓" : "Salin"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-broker-muted">
                Token tidak bisa dilihat kembali untuk alasan keamanan.
                {tokenHint ? (
                  <> Hint: <code className="text-white font-mono">…{tokenHint.replace(/^…/, "")}</code></>
                ) : null}
                {issuedAt ? (
                  <> · Diterbitkan{" "}
                    {new Date(issuedAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </>
                ) : null}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void regen()}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition border",
                loading
                  ? "cursor-wait border-broker-border/40 text-broker-muted"
                  : "border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40"
              )}
            >
              {loading ? "…" : "Regenerasi token"}
            </button>
            <span className="text-[10px] text-broker-muted">Token lama langsung tidak berlaku</span>
          </div>

          {err && <p className="text-[11px] text-broker-danger">{err}</p>}

          <div className="rounded-lg bg-broker-surface/30 px-3 py-2 text-[10px] text-broker-muted leading-relaxed space-y-0.5">
            <p>Cara pakai di MetaTrader:</p>
            <p>1. Buka EA <code className="text-emerald-400">GMRFX_CopyTrader</code> di MT5/MT4</p>
            <p>2. Isi <code className="text-emerald-400">InpCopyToken</code> dengan token ini</p>
            <p>3. Satu token = satu publisher. Untuk copy publisher lain, pasang EA lagi dengan token berbeda.</p>
          </div>
        </div>
      )}
    </div>
  );
}
