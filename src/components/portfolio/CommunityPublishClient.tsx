"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import type { MtCommunityPublishRow } from "@/lib/mtCommunityPublishRows";

function PublishRowForm({ row }: { row: MtCommunityPublishRow }) {
  const router = useRouter();
  const [allowCopy, setAllowCopy] = useState(row.allowCopy);
  const [copyFree, setCopyFree] = useState(row.copyFree);
  const [copyPriceIdr, setCopyPriceIdr] = useState(
    row.copyPriceIdr > 0 ? String(Math.round(row.copyPriceIdr)) : "10000"
  );
  const [watchAlertFree, setWatchAlertFree] = useState(row.watchAlertFree);
  const [watchAlertPriceIdr, setWatchAlertPriceIdr] = useState(
    row.watchAlertPriceIdr > 0 ? String(Math.round(row.watchAlertPriceIdr)) : "5000"
  );
  const [platform, setPlatform] = useState<"mt4" | "mt5">(row.platform === "mt4" ? "mt4" : "mt5");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const priceNum = Number.parseFloat(copyPriceIdr.replace(/,/g, "."));
    if (allowCopy && !copyFree && (!Number.isFinite(priceNum) || priceNum < 1000)) {
      setMsg("Harga copy minimal Rp 1.000");
      return;
    }
    const watchPriceNum = Number.parseFloat(watchAlertPriceIdr.replace(/,/g, "."));
    if (allowCopy && !watchAlertFree && (!Number.isFinite(watchPriceNum) || watchPriceNum < 1000)) {
      setMsg("Harga alert Ikuti minimal Rp 1.000");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/profile/mt-community-publish", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mtLogin: row.mtLogin,
          allowCopy,
          copyFree,
          copyPriceIdr: copyFree ? 0 : priceNum,
          watchAlertFree,
          watchAlertPriceIdr: watchAlertFree ? 0 : watchPriceNum,
          platform,
        }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) {
        setMsg(j.error ?? "Gagal menyimpan");
        return;
      }
      setMsg("Tersimpan.");
      router.refresh();
    } catch {
      setMsg("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  const displayName =
    row.tradeAccountName?.trim() || row.ownerWebsiteName?.trim() || `Akun ${row.mtLogin}`;

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-lg font-semibold text-broker-accent">{row.mtLogin}</p>
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="mt-1 text-xs text-broker-muted">
            {[row.brokerName, row.brokerServer].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-3 shrink-0 rounded-lg border border-broker-accent/40 bg-broker-accent/15 px-4 py-2 text-xs font-semibold text-broker-accent hover:bg-broker-accent/25 disabled:opacity-50 sm:mt-0"
        >
          {loading ? "Menyimpan…" : "Simpan"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 border-t border-broker-border/50 pt-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-broker-muted">
          <input
            type="checkbox"
            checked={allowCopy}
            onChange={(e) => setAllowCopy(e.target.checked)}
            className="rounded border-broker-border"
          />
          Tampilkan di komunitas &amp; izinkan tombol Copy
        </label>

        <div className="text-sm text-broker-muted">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide">Platform</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "mt4" | "mt5")}
            className="w-full rounded-lg border border-broker-border/70 bg-broker-bg/60 px-2 py-1.5 text-xs text-white"
          >
            <option value="mt5">MetaTrader 5</option>
            <option value="mt4">MetaTrader 4</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-broker-muted">Biaya copy</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name={`free-${row.mtLogin}`}
                checked={copyFree}
                onChange={() => setCopyFree(true)}
              />
              Gratis untuk member lain
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name={`free-${row.mtLogin}`}
                checked={!copyFree}
                onChange={() => setCopyFree(false)}
              />
              Berbayar (wallet IDR)
            </label>
          </div>
          {!copyFree ? (
            <div className="mt-2">
              <label className="text-xs text-broker-muted">
                Harga sekali daftar (IDR)
                <input
                  type="text"
                  inputMode="decimal"
                  value={copyPriceIdr}
                  onChange={(e) => setCopyPriceIdr(e.target.value)}
                  className="mt-1 block w-full max-w-xs rounded-lg border border-broker-border/70 bg-broker-bg/60 px-2 py-1.5 font-mono text-sm text-white"
                />
              </label>
              <p className="mt-1 text-[10px] text-broker-muted">
                Member yang copy membayar dari saldo wallet IDR mereka (wajib punya alamat wallet di profil).
                Dana masuk ke saldo wallet Anda. Langganan berbayar berlaku ~30 hari per pembayaran; setelah habis
                mereka mendapat notifikasi &amp; email dan harus memperpanjang lewat tombol Copy lagi.
              </p>
            </div>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-broker-muted">
            Biaya alert posisi (tombol &quot;Ikuti&quot;)
          </p>
          <p className="mb-2 text-xs text-broker-muted">
            Terpisah dari harga Copy. Jika berbayar: satu pembayaran wallet IDR per periode ~30 hari; mereka
            mendapat toast/notifikasi saat posisi buka/tutup. Setelah habis: notifikasi &amp; email, lalu bisa
            perpanjang lewat tombol Ikuti lagi.
          </p>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name={`watch-free-${row.mtLogin}`}
                checked={watchAlertFree}
                onChange={() => setWatchAlertFree(true)}
              />
              Gratis untuk member lain
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
              <input
                type="radio"
                name={`watch-free-${row.mtLogin}`}
                checked={!watchAlertFree}
                onChange={() => setWatchAlertFree(false)}
              />
              Berbayar (wallet IDR, harga sendiri)
            </label>
          </div>
          {!watchAlertFree ? (
            <div className="mt-2">
              <label className="text-xs text-broker-muted">
                Harga sekali aktifkan alert Ikuti (IDR)
                <input
                  type="text"
                  inputMode="decimal"
                  value={watchAlertPriceIdr}
                  onChange={(e) => setWatchAlertPriceIdr(e.target.value)}
                  className="mt-1 block w-full max-w-xs rounded-lg border border-broker-border/70 bg-broker-bg/60 px-2 py-1.5 font-mono text-sm text-white"
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {msg ? (
        <p
          className={clsx(
            "mt-3 text-xs",
            msg.startsWith("Tersimpan") ? "text-emerald-400" : "text-broker-danger"
          )}
        >
          {msg}
        </p>
      ) : null}
    </form>
  );
}

export function CommunityPublishClient({ initialRows }: { initialRows: MtCommunityPublishRow[] }) {
  if (initialRows.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-6 text-sm text-amber-100/90">
        <p className="font-medium text-white">Belum ada akun MT terhubung</p>
        <p className="mt-2 text-broker-muted">
          Pasang EA dengan token di halaman Ringkasan portofolio, lalu kembali ke sini untuk mengatur publikasi
          copy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialRows.map((row) => (
        <PublishRowForm key={row.mtLogin} row={row} />
      ))}
    </div>
  );
}
