"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProfilFollowRequestList } from "@/components/ProfilFollowRequestList";
import { formatJakarta } from "@/lib/jakartaDateFormat";

type Row = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export function ProfilNotificationsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications?limit=50");
    if (!res.ok) {
      setItems([]);
      setLoading(false);
      return;
    }
    const j = (await res.json()) as { items?: Row[] };
    setItems(j.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, readAt: new Date().toISOString() } : x)));
    router.refresh();
  }

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    router.refresh();
  }

  const unread = items.filter((x) => !x.readAt).length;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Permintaan mengikuti</h2>
        </div>
        <div className="mt-3">
          <ProfilFollowRequestList />
        </div>
      </section>

      <section className="border-t border-broker-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Pemberitahuan</h2>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAll()}
              className="text-sm font-medium text-broker-accent hover:underline"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-broker-muted">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-broker-muted">Belum ada notifikasi.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((n) => {
              const inner = (
                <>
                  <p className="font-medium text-white">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-broker-muted">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-broker-muted/70">
                    {formatJakarta(n.createdAt, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </>
              );
              return (
                <li
                  key={n.id}
                  className={[
                    "rounded-xl border px-4 py-3 transition",
                    n.readAt
                      ? "border-broker-border/50 bg-broker-surface/20"
                      : "border-broker-accent/35 bg-broker-accent/10",
                  ].join(" ")}
                >
                  {n.linkUrl ? (
                    <Link
                      href={n.linkUrl}
                      onClick={() => void markRead(n.id)}
                      className="block hover:opacity-90"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => void markRead(n.id)} className="w-full text-left">
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
