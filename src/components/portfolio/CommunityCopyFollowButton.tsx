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

  async function onCopy() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/community/copy-follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publisherUserId, mtLogin }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Gagal");
        return;
      }
      router.refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  if (alreadyFollowing) {
    return <span className="text-xs font-medium text-emerald-400">Sudah diikuti</span>;
  }

  const priceLabel = copyFree
    ? "Gratis"
    : `Rp ${Math.round(copyPriceIdr).toLocaleString("id-ID")}`;

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
