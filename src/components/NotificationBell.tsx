"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return;
      const j = (await res.json()) as { count?: number };
      setCount(Number(j.count ?? 0));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 45000);
    const onTradeAlerts = () => void load();
    window.addEventListener("gmrfx:trade-alerts-received", onTradeAlerts);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("gmrfx:trade-alerts-received", onTradeAlerts);
    };
  }, [load]);

  const n = count ?? 0;

  return (
    <Link
      href="/profil?tab=notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-broker-muted transition hover:bg-broker-surface hover:text-white"
      aria-label="Notifikasi"
      title="Notifikasi"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-broker-accent px-1 text-[10px] font-bold text-broker-bg">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
