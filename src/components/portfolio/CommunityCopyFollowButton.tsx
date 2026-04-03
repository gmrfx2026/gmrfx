"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

type Props = {
  publisherUserId: string;
  mtLogin: string;
  copyFree: boolean;
  copyPriceIdr: number;
  alreadyFollowing: boolean;
};

export function CommunityCopyFollowButton({
  publisherUserId,
  mtLogin,
  copyFree,
  copyPriceIdr,
  alreadyFollowing,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copyToken, setCopyToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    setErr(null);
    setLoading(true);
    setCopyToken(null);
    try {
      const r = await fetch("/api/community/copy-follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisherUserId, mtLogin }),
      });
      const j = (await r.json()) as { error?: string; copyToken?: string };
      if (!r.ok) {
        setErr(j.error ?? "Gagal");
        return;
      }
      if (j.copyToken) {
        setCopyToken(j.copyToken);
      }
      router.refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyToClipboard(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }

  if (alreadyFollowing) {
    return (
      <span className="text-xs font-medium text-emerald-400">
        Sudah diikuti — lihat token di halaman{" "}
        <a href="/profil/portfolio/community/following" className="underline hover:text-emerald-300">
          Mengikuti
        </a>
      </span>
    );
  }

  const priceLabel = copyFree
    ? "Gratis"
    : `Rp ${Math.round(copyPriceIdr).toLocaleString("id-ID")} / 30 hari`;

  // Tampilkan token setelah berhasil berlangganan
  if (copyToken) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3">
        <p className="text-sm font-semibold text-emerald-300">
          ✓ Berhasil! Simpan token EA berikut:
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-broker-bg/80 px-3 py-2 font-mono text-xs text-white break-all">
          <span className="flex-1 select-all">{copyToken}</span>
          <button
            type="button"
            onClick={() => void handleCopyToClipboard(copyToken)}
            className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-700/50 hover:bg-emerald-700/80 text-emerald-200 transition"
          >
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>
        <ul className="space-y-1 text-[11px] text-broker-muted leading-relaxed">
          <li>• Token ini <strong className="text-white">hanya tampil sekali</strong>. Simpan sekarang.</li>
          <li>• Masukkan ke EA <code className="text-emerald-400">GMRFX_CopyTrader</code> sebagai <code className="text-emerald-400">InpCopyToken</code>.</li>
          <li>• Token berlaku 30 hari. Jika hilang, buka halaman{" "}
            <a href="/profil/portfolio/community/following" className="text-emerald-400 hover:underline">
              Mengikuti
            </a>{" "}
            untuk regenerasi.
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onCopy()}
        className={clsx(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
          loading
            ? "cursor-wait border border-broker-border/50 text-broker-muted"
            : "border border-broker-accent/50 bg-broker-accent/15 text-broker-accent hover:bg-broker-accent/25"
        )}
      >
        {loading ? "…" : `Copy — ${priceLabel}`}
      </button>
      {err ? <p className="max-w-[14rem] text-right text-[10px] text-broker-danger">{err}</p> : null}
    </div>
  );
}
