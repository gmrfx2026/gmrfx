"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Item = {
  id: string;
  followerId: string;
  createdAt: string;
  follower: { name: string; image: string | null; memberSlug: string | null };
};

export function ProfilFollowRequestList() {
  const router = useRouter();
  const { show } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/member/follow/pending");
    if (!res.ok) {
      setItems([]);
      setLoading(false);
      return;
    }
    const j = (await res.json()) as { items?: Item[] };
    setItems(j.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(followerId: string, accept: boolean) {
    setBusy(followerId);
    try {
      const res = await fetch("/api/member/follow/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId, accept }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal.", "err");
        return;
      }
      show(accept ? "Disetujui." : "Ditolak.");
      await load();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-broker-muted">Memuat permintaan…</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-broker-muted">Tidak ada permintaan mengikuti yang menunggu.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-broker-border/70 bg-broker-bg/50 px-4 py-3"
        >
          <div>
            <p className="font-medium text-white">{it.follower.name}</p>
            <p className="text-xs text-broker-muted">Meminta mengikuti Anda</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy === it.followerId}
              onClick={() => void respond(it.followerId, true)}
              className="rounded-lg bg-broker-accent px-3 py-1.5 text-sm font-semibold text-broker-bg disabled:opacity-50"
            >
              Setujui
            </button>
            <button
              type="button"
              disabled={busy === it.followerId}
              onClick={() => void respond(it.followerId, false)}
              className="rounded-lg border border-broker-border px-3 py-1.5 text-sm text-broker-muted hover:bg-broker-surface/50 disabled:opacity-50"
            >
              Tolak
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
