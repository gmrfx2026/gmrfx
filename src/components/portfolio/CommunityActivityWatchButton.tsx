"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

type Props = {
  publisherUserId: string;
  mtLogin: string;
  initiallyWatching: boolean;
  watchAlertFree: boolean;
  watchAlertPriceIdr: number;
};

export function CommunityActivityWatchButton({
  publisherUserId,
  mtLogin,
  initiallyWatching,
  watchAlertFree,
  watchAlertPriceIdr,
}: Props) {
  const router = useRouter();
  const [watching, setWatching] = useState(initiallyWatching);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startWatch() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/community/activity-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisherUserId, mtLogin }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Gagal");
        return;
      }
      setWatching(true);
      router.refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  async function stopWatch() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/community/activity-watch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisherUserId, mtLogin }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Gagal");
        return;
      }
      setWatching(false);
      router.refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  if (watching) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={loading}
          onClick={() => void stopWatch()}
          title="Hentikan pemberitahuan posisi untuk akun ini"
          className={clsx(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
            loading
              ? "cursor-wait border-broker-border/50 text-broker-muted"
              : "border-broker-muted/40 bg-broker-bg/40 text-broker-muted hover:border-broker-danger/50 hover:text-broker-danger"
          )}
        >
          {loading ? "…" : "Berhenti ikuti"}
        </button>
        <span className="text-[10px] text-emerald-400/90">Alert posisi aktif</span>
        {err ? <p className="max-w-[14rem] text-right text-[10px] text-broker-danger">{err}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        title="Dapat toast, notifikasi, dan bunyi (jika beep chat aktif) saat akun ini buka/tutup posisi"
        onClick={() => void startWatch()}
        className={clsx(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
          loading
            ? "cursor-wait border border-broker-border/50 text-broker-muted"
            : "border border-sky-500/45 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
        )}
      >
        {loading
          ? "…"
          : watchAlertFree
            ? "Ikuti — Gratis"
            : `Ikuti — Rp ${Math.round(watchAlertPriceIdr).toLocaleString("id-ID")} / ~30 hari`}
      </button>
      {err ? <p className="max-w-[14rem] text-right text-[10px] text-broker-danger">{err}</p> : null}
    </div>
  );
}
