"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  attachAudioUnlockOnFirstUserGesture,
  playChatIncomingBeep,
  readChatBeepPreference,
} from "@/lib/chatBeep";

type TradeAlertItem = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  createdAt: string;
};

const POLL_VISIBLE_MS = 4000;
const POLL_HIDDEN_MS = 30000;

/** Memanggil toast + beep untuk alert posisi komunitas tanpa refresh halaman. */
export function CommunityTradeAlertPoller() {
  const { data: session, status } = useSession();
  const { show } = useToast();
  const afterRef = useRef<string>(new Date().toISOString());
  const seenRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/notifications/trade-alerts?after=${encodeURIComponent(afterRef.current)}`,
        { credentials: "same-origin" }
      );
      if (!res.ok) return;
      const j = (await res.json()) as { items?: TradeAlertItem[] };
      const items = j.items ?? [];
      if (items.length === 0) return;

      let latestMs = new Date(afterRef.current).getTime();
      let playedBeep = false;
      let didShow = false;
      for (const it of items) {
        if (seenRef.current.has(it.id)) continue;
        seenRef.current.add(it.id);
        const msg = [it.title, it.body].filter(Boolean).join(" — ");
        show(msg);
        didShow = true;
        const t = new Date(it.createdAt).getTime();
        if (t > latestMs) latestMs = t;
        if (!playedBeep && readChatBeepPreference()) {
          playChatIncomingBeep();
          playedBeep = true;
        }
      }
      afterRef.current = new Date(latestMs).toISOString();
      if (didShow) window.dispatchEvent(new CustomEvent("gmrfx:trade-alerts-received"));
    } catch {
      /* ignore */
    }
  }, [show]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    afterRef.current = new Date().toISOString();
    seenRef.current.clear();
    attachAudioUnlockOnFirstUserGesture();

    let intervalId: number | undefined;

    const intervalMs = () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? POLL_VISIBLE_MS
        : POLL_HIDDEN_MS;

    const arm = () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      intervalId = window.setInterval(() => void poll(), intervalMs()) as number;
    };

    void poll();
    arm();

    const onVis = () => {
      void poll();
      arm();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [status, session?.user?.id, poll]);

  return null;
}
