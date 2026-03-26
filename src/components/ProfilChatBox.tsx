"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAT_BEEP_STORAGE_KEY,
  playChatIncomingBeep,
  readChatBeepPreference,
} from "@/lib/chatBeep";
import { useToast } from "@/components/ToastProvider";

type Peer = { id: string; name: string | null; email: string | null; online?: boolean };

type ChatMode = "private" | "public";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName?: string | null;
  createdAt: string;
};

export function ProfilChatBox({
  peers,
  selfId,
  initialPeerId,
  initialMode,
}: {
  peers: Peer[];
  selfId: string;
  initialPeerId?: string;
  initialMode?: ChatMode;
}) {
  const { show } = useToast();
  const [mode, setMode] = useState<ChatMode>(initialMode ?? "private");
  const [peerId, setPeerId] = useState(initialPeerId ?? peers[0]?.id ?? "");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [beepEnabled, setBeepEnabled] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdsRef = useRef<Set<string>>(new Set());
  const threadInitializedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beepEnabledRef = useRef(false);

  useEffect(() => {
    const saved = readChatBeepPreference();
    setBeepEnabled(saved);
    beepEnabledRef.current = saved;
  }, []);

  const applyMessages = useCallback((next: Msg[]) => {
    const prevIds = lastMessageIdsRef.current;
    const wasInit = threadInitializedRef.current;

    if (wasInit && beepEnabledRef.current) {
      const newOnes = next.filter((m) => !prevIds.has(m.id));
      const fromOthers = newOnes.filter((m) => m.senderId !== selfId);
      if (fromOthers.length > 0) {
        playChatIncomingBeep(audioCtxRef);
      }
    }

    lastMessageIdsRef.current = new Set(next.map((m) => m.id));
    threadInitializedRef.current = true;
    setMessages(next);
  }, [selfId]);

  useEffect(() => {
    lastMessageIdsRef.current = new Set();
    threadInitializedRef.current = false;
  }, [mode, peerId]);

  const loadPrivate = useCallback(
    async (currentPeerId: string) => {
      const res = await fetch(`/api/chat/thread?peerId=${encodeURIComponent(currentPeerId)}`);
      const data = await res.json().catch(() => ({}));
      applyMessages((data.messages ?? []) as Msg[]);
    },
    [applyMessages],
  );

  const loadPublic = useCallback(async () => {
    const res = await fetch("/api/chat/public/thread");
    const data = await res.json().catch(() => ({}));
    applyMessages((data.messages ?? []) as Msg[]);
  }, [applyMessages]);

  useEffect(() => {
    let cancelled = false;
    const doLoad = () => {
      if (cancelled) return;
      if (mode === "public") {
        void loadPublic();
        return;
      }
      if (!peerId) return;
      void loadPrivate(peerId);
    };

    doLoad();

    const interval = setInterval(() => {
      if (cancelled) return;
      doLoad();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [mode, peerId, loadPrivate, loadPublic]);

  useEffect(() => {
    // Auto-scroll saat pesan baru masuk.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    // Chat privat (2 user)
    if (mode === "private") {
      if (!peerId) return;
      setLoading(true);
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId, body }),
      });
      setLoading(false);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        show(typeof j.error === "string" ? j.error : "Gagal mengirim pesan", "err");
        return;
      }
      setBody("");
      show("Pesan terkirim");
      void loadPrivate(peerId);
      return;
    }

    // Chat umum (global)
    setLoading(true);
    const resPub = await fetch("/api/chat/public/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setLoading(false);
    if (!resPub.ok) {
      const j = await resPub.json().catch(() => ({}));
      show(typeof j.error === "string" ? j.error : "Gagal mengirim pesan", "err");
      return;
    }
    setBody("");
    show("Pesan terkirim");
    void loadPublic();
  }

  if (mode === "private" && !peers.length) {
    return (
      <section className="mt-12 border-t border-broker-border pt-10">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <p className="mt-2 text-sm text-broker-muted">Belum ada member lain untuk diajak chat.</p>
      </section>
    );
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white";

  return (
    <section className="mt-12 border-t border-broker-border pt-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {mode === "public" ? "Live Chat Umum" : "Chat antar member"}
          </h2>
          <p className="mt-1 text-xs text-broker-muted">
            {mode === "public"
              ? "Semua member yang login bisa membaca & mengirim pesan."
              : "Pilih lawan bicara — pesan tersimpan di server."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-broker-muted">
            <input
              type="checkbox"
              checked={beepEnabled}
              onChange={(e) => {
                const on = e.target.checked;
                setBeepEnabled(on);
                beepEnabledRef.current = on;
                try {
                  window.localStorage.setItem(CHAT_BEEP_STORAGE_KEY, on ? "1" : "0");
                } catch {
                  /* private mode */
                }
                if (on) playChatIncomingBeep(audioCtxRef);
              }}
              className="h-4 w-4 rounded border-broker-border bg-broker-bg text-broker-accent focus:ring-broker-accent"
            />
            Beep pesan masuk
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("private")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                mode === "private"
                  ? "bg-broker-accent text-broker-bg"
                  : "bg-broker-surface text-broker-muted hover:text-white"
              }`}
            >
              Privat
            </button>
            <button
              type="button"
              onClick={() => setMode("public")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                mode === "public"
                  ? "bg-broker-accent text-broker-bg"
                  : "bg-broker-surface text-broker-muted hover:text-white"
              }`}
            >
              Umum
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 w-full max-w-4xl space-y-3">
        {mode === "private" && (
          <div>
            <label className="text-xs text-broker-muted">Member</label>
            <select
              className={input}
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
            >
              {peers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.email}
                  {p.online ? " (Online)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-broker-border p-3 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.senderId === selfId ? "text-right text-broker-accent" : "text-left text-broker-muted"
              }
            >
              <span className="inline-block rounded-lg bg-broker-surface/60 px-2 py-1">
                {m.senderName && mode === "public" && (
                  <span className="mb-1 block text-[10px] text-broker-muted/70">{m.senderName}</span>
                )}
                {m.body}
                <span className="mt-1 block text-[10px] text-broker-muted/70">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                    new Date(m.createdAt)
                  )}
                </span>
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input
            className={input}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === "public" ? "Pesan untuk chat umum…" : "Pesan…"}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
          >
            Kirim
          </button>
        </form>
      </div>
    </section>
  );
}
