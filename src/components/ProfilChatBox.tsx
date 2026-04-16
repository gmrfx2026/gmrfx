"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAT_BEEP_STORAGE_KEY,
  playChatIncomingBeep,
  readChatBeepPreference,
} from "@/lib/chatBeep";
import { useToast } from "@/components/ToastProvider";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { SmallUserAvatar } from "@/components/SmallUserAvatar";

export type ChatPeer = {
  id: string;
  name: string | null;
  email: string | null;
  online?: boolean;
  image?: string | null;
  /** Slug profil publik; jika kosong dipakai `/member/[id]`. */
  memberSlug?: string | null;
};

type Peer = ChatPeer;

type ChatMode = "private" | "public";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName?: string | null;
  createdAt: string;
};

type DmAccess = {
  allowed: boolean;
  state: "allowed" | "need_request" | "pending_out" | "pending_in" | "declined_out";
  requesterId?: string;
  requesterName?: string | null;
  introMessage?: string | null;
};

function peerPublicProfileHref(p: Peer): string {
  const slug = p.memberSlug?.trim();
  if (slug) return `/${slug}`;
  return `/member/${encodeURIComponent(p.id)}`;
}

export function ProfilChatBox({
  peers,
  selfId,
  initialPeerId,
  initialMode,
  variant = "page",
  onMessengerPeerSelect,
}: {
  peers: Peer[];
  selfId: string;
  initialPeerId?: string;
  initialMode?: ChatMode;
  variant?: "page" | "messenger";
  /** Messenger: setelah klik member di sidebar — sinkron URL & buka panel (dari induk). */
  onMessengerPeerSelect?: (peerId: string) => void;
}) {
  const { show } = useToast();
  const [mode, setMode] = useState<ChatMode>(initialMode ?? "private");
  const [peerId, setPeerId] = useState(initialPeerId ?? peers[0]?.id ?? "");

  useEffect(() => {
    if (!initialPeerId) return;
    if (peers.some((p) => p.id === initialPeerId)) {
      setPeerId(initialPeerId);
    }
  }, [initialPeerId, peers]);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [introRequest, setIntroRequest] = useState("");
  const [dmAccess, setDmAccess] = useState<DmAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestingDm, setRequestingDm] = useState(false);
  const [respondingDm, setRespondingDm] = useState(false);
  const [beepEnabled, setBeepEnabled] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdsRef = useRef<Set<string>>(new Set());
  const threadInitializedRef = useRef(false);
  const threadLoadErrorShownRef = useRef(false);
  const beepEnabledRef = useRef(false);

  useEffect(() => {
    const saved = readChatBeepPreference();
    setBeepEnabled(saved);
    beepEnabledRef.current = saved;
  }, []);

  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileShowMemberList, setMobileShowMemberList] = useState(true);

  /** Panel messenger mengambang selalu sempit (~380px); jangan pakai lebar viewport. */
  const stackPeersNav = variant === "messenger" || isNarrow;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!stackPeersNav) return;
    if (initialPeerId && peers.some((p) => p.id === initialPeerId)) {
      setMobileShowMemberList(false);
    }
  }, [stackPeersNav, initialPeerId, peers]);

  const applyMessages = useCallback((next: Msg[]) => {
    const prevIds = lastMessageIdsRef.current;
    const wasInit = threadInitializedRef.current;

    if (wasInit && beepEnabledRef.current) {
      const newOnes = next.filter((m) => !prevIds.has(m.id));
      const fromOthers = newOnes.filter((m) => m.senderId !== selfId);
      if (fromOthers.length > 0) {
        playChatIncomingBeep();
      }
    }

    lastMessageIdsRef.current = new Set(next.map((m) => m.id));
    threadInitializedRef.current = true;
    setMessages(next);
  }, [selfId]);

  useEffect(() => {
    lastMessageIdsRef.current = new Set();
    threadInitializedRef.current = false;
    threadLoadErrorShownRef.current = false;
    setDmAccess(null);
    setIntroRequest("");
  }, [mode, peerId]);

  const loadPrivate = useCallback(
    async (currentPeerId: string) => {
      const res = await fetch(`/api/chat/thread?peerId=${encodeURIComponent(currentPeerId)}`, {
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as {
        messages?: Msg[];
        dmAccess?: DmAccess;
        error?: unknown;
      };
      if (data.dmAccess) {
        setDmAccess(data.dmAccess);
      }
      const err = typeof data.error === "string" ? data.error : "";
      if (err && !threadLoadErrorShownRef.current) {
        threadLoadErrorShownRef.current = true;
        show(err, "err");
      }
      applyMessages((data.messages ?? []) as Msg[]);
    },
    [applyMessages, show],
  );

  const loadPublic = useCallback(async () => {
    const res = await fetch("/api/chat/public/thread", { credentials: "same-origin" });
    const data = (await res.json().catch(() => ({}))) as {
      messages?: Msg[];
      error?: unknown;
    };
    const err = typeof data.error === "string" ? data.error : "";
    if (err && !threadLoadErrorShownRef.current) {
      threadLoadErrorShownRef.current = true;
      show(err, "err");
    }
    applyMessages((data.messages ?? []) as Msg[]);
  }, [applyMessages, show]);

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
    const text = body.trim();
    if (!text) return;

    if (mode === "private" && !peerId) {
      show("Pilih member untuk chat privat.", "err");
      return;
    }

    if (mode === "private" && dmAccess && !dmAccess.allowed) {
      show("Chat privat belum dibuka untuk percakapan ini.", "err");
      return;
    }

    async function readSendError(res: Response): Promise<string> {
      const raw = await res.text();
      const trimmed = raw.trim();
      if (!trimmed) {
        return res.status >= 500
          ? "Error server tanpa detail (500). Buka Vercel → Deployment → Functions / Logs; pastikan DATABASE_URL & AUTH_SECRET ada untuk lingkungan Production, lalu redeploy."
          : `Gagal mengirim (HTTP ${res.status})`;
      }
      try {
        const j = JSON.parse(trimmed) as { error?: unknown };
        if (typeof j.error === "string") return j.error;
        if (j.error != null && typeof j.error === "object") {
          const m = (j.error as { message?: unknown }).message;
          if (typeof m === "string") return m;
        }
      } catch {
        /* bukan JSON */
      }
      if (trimmed.startsWith("<!DOCTYPE") || trimmed.toLowerCase().startsWith("<html")) {
        return `HTTP ${res.status}: respons HTML (bukan JSON). Buka Vercel → Logs, filter POST /api/chat/… Pastikan deployment terbaru sudah Ready. Cek env Production: DATABASE_URL, AUTH_SECRET, AUTH_URL.`;
      }
      return trimmed.slice(0, 240) || `Gagal mengirim (HTTP ${res.status})`;
    }

    setLoading(true);
    try {
      if (mode === "private") {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ peerId, body: text }),
        });
        if (!res.ok) {
          show(await readSendError(res), "err");
          return;
        }
        setBody("");
        show("Pesan terkirim");
        void loadPrivate(peerId);
        return;
      }

      const resPub = await fetch("/api/chat/public/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ body: text }),
      });
      if (!resPub.ok) {
        show(await readSendError(resPub), "err");
        return;
      }
      setBody("");
      show("Pesan terkirim");
      void loadPublic();
    } finally {
      setLoading(false);
    }
  }

  async function sendDmRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!peerId) return;
    setRequestingDm(true);
    try {
      const res = await fetch("/api/chat/dm-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ peerId, introMessage: introRequest.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; state?: string };
      if (!res.ok) {
        show(data.error ?? "Gagal mengirim permintaan.", "err");
        return;
      }
      show("Permintaan chat terkirim.");
      setIntroRequest("");
      void loadPrivate(peerId);
    } finally {
      setRequestingDm(false);
    }
  }

  async function respondDm(accept: boolean) {
    if (!peerId) return;
    setRespondingDm(true);
    try {
      const res = await fetch("/api/chat/dm-request/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ requesterId: peerId, accept }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        show(data.error ?? "Gagal memproses.", "err");
        return;
      }
      show(accept ? "Permintaan disetujui. Anda bisa mengobrol sekarang." : "Permintaan ditolak.");
      void loadPrivate(peerId);
    } finally {
      setRespondingDm(false);
    }
  }

  const isMessenger = variant === "messenger";

  const showMessengerBackToList =
    isMessenger && mode === "private" && peers.length > 0 && !mobileShowMemberList;

  if (mode === "private" && !peers.length) {
    if (isMessenger) {
      return (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-broker-muted">
          Belum ada member lain untuk diajak chat.
        </div>
      );
    }
    return (
      <section className="mt-12 border-t border-broker-border pt-10">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <p className="mt-2 text-sm text-broker-muted">Belum ada member lain untuk diajak chat.</p>
      </section>
    );
  }

  const input = isMessenger
    ? "mt-1 w-full rounded-full border border-broker-border bg-broker-bg px-4 py-2.5 text-sm text-white placeholder:text-broker-muted shadow-sm"
    : "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white";

  const modeBtn = (active: boolean, isMessengerUi: boolean) =>
    isMessengerUi
      ? active
        ? "rounded-full bg-broker-accent px-3 py-1 text-xs font-semibold text-broker-bg shadow-sm"
        : "rounded-full border border-broker-border bg-broker-bg px-3 py-1 text-xs font-semibold text-broker-muted hover:border-broker-accent/40 hover:text-white"
      : active
        ? "rounded-lg bg-broker-accent px-3 py-2 text-sm font-semibold text-broker-bg"
        : "rounded-lg bg-broker-surface text-sm font-semibold text-broker-muted hover:text-white";

  const messengerToolbar = (
    <div className="shrink-0 border-b border-broker-border bg-broker-surface px-2 py-2 shadow-sm sm:px-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showMessengerBackToList ? (
            <button
              type="button"
              onClick={() => setMobileShowMemberList(true)}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-broker-border bg-broker-bg px-2 py-1.5 text-xs font-medium text-broker-muted hover:border-broker-accent/40 hover:text-white"
              aria-label="Kembali ke daftar member"
            >
              <span className="text-broker-accent" aria-hidden>
                ←
              </span>
              <span>Daftar</span>
            </button>
          ) : null}
          <p className="min-w-0 truncate text-sm font-semibold text-white">Chat</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <label className="flex items-center gap-1.5 text-[10px] text-broker-muted">
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
                if (on) playChatIncomingBeep();
              }}
              className="h-3.5 w-3.5 rounded border-broker-border bg-broker-bg text-broker-accent focus:ring-broker-accent"
            />
            Beep
          </label>
          <button
            type="button"
            onClick={() => {
              setMode("private");
              if (isMessenger) setMobileShowMemberList(!peerId);
            }}
            className={modeBtn(mode === "private", true)}
          >
            Privat
          </button>
          <button type="button" onClick={() => setMode("public")} className={modeBtn(mode === "public", true)}>
            Umum
          </button>
        </div>
      </div>
    </div>
  );

  function renderMessengerPeerList() {
    if (mode !== "private" || peers.length === 0) return null;
    return (
      <aside
        className="flex w-full flex-1 flex-col gap-1 overflow-y-auto bg-broker-surface px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(0,211,149,0.35)_transparent]"
        aria-label="Daftar member"
      >
        <p className="px-1 pb-1 text-[11px] text-broker-muted">Ketuk nama untuk chat · ketuk avatar untuk profil</p>
        {peers.map((p) => {
          const raw = (p.name ?? p.email ?? "?").trim();
          const short = raw.split(/\s+/)[0]?.slice(0, 24) ?? "?";
          const ringWrap = `rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-broker-surface ${
            peerId === p.id ? "ring-broker-accent" : "ring-transparent"
          }`;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-xl py-2 pl-2 pr-2 transition ${
                peerId === p.id ? "bg-broker-accent/15 ring-1 ring-broker-accent/45" : "hover:bg-broker-bg/35"
              }`}
            >
              <a
                href={peerPublicProfileHref(p)}
                className={`shrink-0 cursor-pointer ${ringWrap}`}
                title={`Buka profil publik — ${raw}`}
              >
                <SmallUserAvatar name={p.name} image={p.image ?? null} size="md" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setPeerId(p.id);
                  onMessengerPeerSelect?.(p.id);
                  if (isMessenger) setMobileShowMemberList(false);
                }}
                title={raw + (p.online ? " · Online" : "")}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium text-white"
              >
                {short}
              </button>
            </div>
          );
        })}
      </aside>
    );
  }

  const narrowPrivateMemberList =
    isMessenger && mode === "private" && peers.length > 0 && mobileShowMemberList;

  const messengerThreadPeerBar =
    isMessenger && mode === "private" && peerId && !mobileShowMemberList
      ? (() => {
          const active = peers.find((p) => p.id === peerId);
          if (!active) return null;
          const label = (active.name ?? active.email ?? "?").trim();
          return (
            <div className="flex shrink-0 flex-col gap-2 border-b border-broker-border/80 bg-broker-bg/50 px-2 py-2 text-xs">
              <button
                type="button"
                onClick={() => setMobileShowMemberList(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-broker-accent/40 bg-broker-accent/15 px-3 py-2 text-xs font-semibold text-broker-accent hover:bg-broker-accent/25"
              >
                <span aria-hidden>←</span>
                Pilih member lain
              </button>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-broker-muted">
                  Dengan <span className="font-semibold text-white">{label}</span>
                </span>
                <a
                  href={peerPublicProfileHref(active)}
                  className="shrink-0 rounded-md px-2 py-1 font-medium text-broker-accent hover:bg-broker-accent/10 hover:underline"
                >
                  Profil
                </a>
              </div>
            </div>
          );
        })()
      : null;

  const pageChatHeader = (
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
              if (on) playChatIncomingBeep();
            }}
            className="h-4 w-4 rounded border-broker-border bg-broker-bg text-broker-accent focus:ring-broker-accent"
          />
          Beep pesan masuk
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode("private")} className={modeBtn(mode === "private", false)}>
            Privat
          </button>
          <button type="button" onClick={() => setMode("public")} className={modeBtn(mode === "public", false)}>
            Umum
          </button>
        </div>
      </div>
    </div>
  );

  const mainContent = (
      <div
        className={
          isMessenger
            ? "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2 pb-2 pt-2"
            : "mt-4 w-full max-w-4xl space-y-3"
        }
      >
        {!isMessenger && mode === "private" && (
          <div>
            <label className="text-xs text-broker-muted">Member</label>
            <select className={input} value={peerId} onChange={(e) => setPeerId(e.target.value)}>
              {peers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.email}
                  {p.online ? " (Online)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {mode === "private" &&
          peerId &&
          dmAccess &&
          !dmAccess.allowed &&
          (dmAccess.state === "need_request" || dmAccess.state === "declined_out") && (
            <div
              className={
                isMessenger
                  ? "rounded-xl border border-broker-border bg-broker-surface/80 p-3 text-sm text-broker-muted shadow-sm"
                  : "rounded-lg border border-broker-border bg-broker-surface/40 p-4 text-sm text-broker-muted"
              }
            >
              <p className={isMessenger ? "font-medium text-white" : "font-medium text-white"}>
                {dmAccess.state === "declined_out"
                  ? "Permintaan chat sebelumnya ditolak. Anda bisa mengirim permintaan baru."
                  : "Anda belum mengikuti member ini dan belum ada izin chat. Kirim permintaan — lawan bicara harus menyetujui terlebih dahulu."}
              </p>
              <form onSubmit={sendDmRequest} className="mt-3 space-y-2">
                <label className={`block text-xs ${isMessenger ? "text-broker-muted" : "text-broker-muted"}`}>
                  Pesan pengantar (opsional)
                </label>
                <textarea
                  className={`${input} min-h-[72px] resize-y rounded-xl`}
                  value={introRequest}
                  onChange={(e) => setIntroRequest(e.target.value)}
                  placeholder="Halo, saya ingin berdiskusi tentang…"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={requestingDm}
                  className={
                    isMessenger
                      ? "rounded-full bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
                      : "rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
                  }
                >
                  {requestingDm ? "Mengirim…" : "Kirim permintaan chat"}
                </button>
              </form>
            </div>
          )}

        {mode === "private" && peerId && dmAccess?.state === "pending_out" && (
          <p
            className={
              isMessenger
                ? "rounded-xl border border-broker-gold/35 bg-broker-gold/10 px-3 py-2 text-sm text-broker-gold"
                : "rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90"
            }
          >
            Menunggu lawan menyetujui permintaan chat Anda. Anda belum bisa mengirim pesan sampai disetujui.
          </p>
        )}

        {mode === "private" && peerId && dmAccess?.state === "pending_in" && (
          <div
            className={
              isMessenger
                ? "rounded-xl border border-broker-border bg-broker-surface/80 p-3 text-sm text-broker-muted shadow-sm"
                : "rounded-lg border border-broker-accent/40 bg-broker-surface/60 p-4 text-sm"
            }
          >
            <p className={isMessenger ? "font-medium text-white" : "font-medium text-white"}>
              {(dmAccess.requesterName ?? peers.find((p) => p.id === peerId)?.name ?? "Member ini")} ingin mengobrol
              dengan Anda.
            </p>
            {dmAccess.introMessage ? (
              <p className={`mt-2 whitespace-pre-wrap ${isMessenger ? "text-broker-muted" : "text-broker-muted"}`}>
                {dmAccess.introMessage}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={respondingDm}
                onClick={() => void respondDm(true)}
                className={
                  isMessenger
                    ? "rounded-full bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
                    : "rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
                }
              >
                Setujui
              </button>
              <button
                type="button"
                disabled={respondingDm}
                onClick={() => void respondDm(false)}
                className={
                  isMessenger
                    ? "rounded-full border border-broker-border bg-broker-bg px-4 py-2 text-sm font-semibold text-broker-muted hover:text-white disabled:opacity-50"
                    : "rounded-lg border border-broker-border bg-broker-bg px-4 py-2 text-sm font-semibold text-broker-muted hover:text-white disabled:opacity-50"
                }
              >
                Tolak
              </button>
            </div>
          </div>
        )}

        <div
          className={
            isMessenger
              ? "min-h-0 flex-1 space-y-2 overflow-y-auto px-1 py-1"
              : "max-h-64 space-y-2 overflow-y-auto rounded-lg border border-broker-border p-3 text-sm"
          }
        >
          {messages.map((m) => {
            const mine = m.senderId === selfId;
            if (isMessenger) {
              return (
                <div key={m.id} className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={
                      mine
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-broker-accent px-3 py-2 text-left text-sm text-broker-bg shadow-sm"
                        : "max-w-[85%] rounded-2xl rounded-bl-md border border-broker-border bg-broker-surface px-3 py-2 text-left text-sm text-white shadow-sm"
                    }
                  >
                    {m.senderName && mode === "public" && (
                      <span className="mb-1 block text-[10px] font-semibold text-broker-muted">{m.senderName}</span>
                    )}
                    <span className="whitespace-pre-wrap break-words">{m.body}</span>
                    <span
                      className={`mt-1 block text-[10px] ${mine ? "text-broker-bg/80" : "text-broker-muted"}`}
                    >
                      {formatJakarta(m.createdAt, { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={m.id}
                className={mine ? "text-right text-broker-accent" : "text-left text-broker-muted"}
              >
                <span className="inline-block rounded-lg bg-broker-surface/60 px-2 py-1">
                  {m.senderName && mode === "public" && (
                    <span className="mb-1 block text-[10px] text-broker-muted/70">{m.senderName}</span>
                  )}
                  {m.body}
                  <span className="mt-1 block text-[10px] text-broker-muted/70">
                    {formatJakarta(m.createdAt, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        {mode === "private" && !peerId ? (
          <p className={`text-xs ${isMessenger ? "text-broker-muted" : "text-broker-muted"}`}>
            Pilih member untuk chat privat.
          </p>
        ) : mode === "private" && !dmAccess ? (
          <p className={`text-xs ${isMessenger ? "text-broker-muted" : "text-broker-muted"}`}>Memuat status chat…</p>
        ) : mode === "private" && dmAccess && !dmAccess.allowed ? null : (
          <form
            onSubmit={send}
            className={
              isMessenger
                ? "flex shrink-0 items-center gap-2 rounded-full border border-broker-border bg-broker-surface px-2 py-1.5 shadow-md"
                : "flex gap-2"
            }
          >
            <input
              className={
                isMessenger
                  ? "min-w-0 flex-1 border-0 bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-broker-muted"
                  : input
              }
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={mode === "public" ? "Pesan untuk chat umum…" : "Aa"}
            />
            <button
              type="submit"
              disabled={loading}
              className={
                isMessenger
                  ? "shrink-0 rounded-full bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
                  : "shrink-0 rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
              }
            >
              Kirim
            </button>
          </form>
        )}
      </div>
  );

  const chatBody = (
    <>
      {!isMessenger ? (
        <>
          {pageChatHeader}
          {mainContent}
        </>
      ) : narrowPrivateMemberList ? (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          {messengerToolbar}
          {renderMessengerPeerList()}
        </div>
      ) : (
        <div className="flex h-full min-h-0 w-full flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {messengerToolbar}
            {messengerThreadPeerBar}
            {mainContent}
          </div>
        </div>
      )}
    </>
  );

  if (isMessenger) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col bg-broker-bg">
        <div className="min-h-0 flex-1">{chatBody}</div>
      </div>
    );
  }

  return <section className="mt-12 border-t border-broker-border pt-10">{chatBody}</section>;
}
