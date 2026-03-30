"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { playChatIncomingBeep, readChatBeepPreference } from "@/lib/chatBeep";

type TradeAlertItem = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const { show } = useToast();
  const [count, setCount] = useState<number | null>(null);
  const tradeAlertAfterRef = useRef<string>(new Date().toISOString());
  const seenTradeAlertIdsRef = useRef<Set<string>>(new Set());
  const tradeAlertBeepCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function pollTradeAlerts() {
      try {
        const res = await fetch(
          `/api/notifications/trade-alerts?after=${encodeURIComponent(tradeAlertAfterRef.current)}`,
          { credentials: "same-origin" }
        );
        if (!res.ok) return;
        const j = (await res.json()) as { items?: TradeAlertItem[] };
        const items = j.items ?? [];
        if (cancelled || items.length === 0) return;

        let latestMs = new Date(tradeAlertAfterRef.current).getTime();
        let playedBeep = false;
        for (const it of items) {
          if (seenTradeAlertIdsRef.current.has(it.id)) continue;
          seenTradeAlertIdsRef.current.add(it.id);
          const msg = [it.title, it.body].filter(Boolean).join(" — ");
          show(msg);
          const t = new Date(it.createdAt).getTime();
          if (t > latestMs) latestMs = t;
          if (!playedBeep && readChatBeepPreference()) {
            playChatIncomingBeep(tradeAlertBeepCtxRef);
            playedBeep = true;
          }
        }
        tradeAlertAfterRef.current = new Date(latestMs).toISOString();
      } catch {
        /* ignore */
      }
    }

    tradeAlertAfterRef.current = new Date().toISOString();
    seenTradeAlertIdsRef.current.clear();
    void pollTradeAlerts();
    const ta = window.setInterval(() => void pollTradeAlerts(), 12000);
    return () => {
      cancelled = true;
      window.clearInterval(ta);
    };
  }, [show]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (!res.ok) return;
        const j = (await res.json()) as { count?: number };
        if (!cancelled) setCount(Number(j.count ?? 0));
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void load();
    const t = window.setInterval(() => void load(), 45000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

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
