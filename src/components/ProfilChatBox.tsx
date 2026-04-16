"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_BEEP_STORAGE_KEY,
  playChatIncomingBeep,
  readChatBeepPreference,
} from "@/lib/chatBeep";
import { useToast } from "@/components/ToastProvider";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { SmallUserAvatar } from "@/components/SmallUserAvatar";
import { ChatEmojiPicker } from "@/components/chat/ChatEmojiPicker";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Peer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  /** Debounced global member search (hanya ketika panel list terbuka & query >= 2 char). */
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/chat/search-members?q=${encodeURIComponent(q)}`, {
          credentials: "same-origin",
        });
        const data = (await r.json().catch(() => ({}))) as { peers?: Peer[] };
        if (!cancelled) setSearchResults(Array.isArray(data.peers) ? data.peers : []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [searchQuery]);

  /** Peers yang cocok dengan query dari daftar lokal (koneksi follow) + hasil search global yg belum ada di lokal. */
  const combinedPeers = useMemo<Peer[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return peers;
    const localMatch = peers.filter((p) => {
      const n = (p.name ?? "").toLowerCase();
      const s = (p.memberSlug ?? "").toLowerCase();
      const e = (p.email ?? "").toLowerCase();
      return n.includes(q) || s.includes(q) || e.includes(q);
    });
    const seen = new Set(localMatch.map((p) => p.id));
    const extra = searchResults.filter((p) => !seen.has(p.id) && p.id !== selfId);
    return [...localMatch, ...extra];
  }, [peers, searchQuery, searchResults, selfId]);

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
    if (mode !== "private") return null;
    const q = searchQuery.trim();
    const hasResults = combinedPeers.length > 0;
    const localCount = q
      ? peers.filter((p) => {
          const n = (p.name ?? "").toLowerCase();
          const s = (p.memberSlug ?? "").toLowerCase();
          const e = (p.email ?? "").toLowerCase();
          return n.includes(q.toLowerCase()) || s.includes(q.toLowerCase()) || e.includes(q.toLowerCase());
        }).length
      : peers.length;

    return (
      <div className="flex w-full flex-1 flex-col overflow-hidden bg-broker-surface">
        <div className="shrink-0 px-2 pb-2 pt-1">
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-broker-muted"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari member…"
              aria-label="Cari member"
              className="w-full rounded-full border border-broker-border bg-broker-bg py-2 pl-8 pr-8 text-sm text-white placeholder:text-broker-muted focus:border-broker-accent/60 focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Bersihkan pencarian"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-broker-muted hover:bg-broker-surface hover:text-white"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
        <aside
          className="flex w-full flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(0,211,149,0.35)_transparent]"
          aria-label="Daftar member"
        >
          {!q ? (
            <p className="px-1 pb-1 text-[11px] text-broker-muted">
              {peers.length > 0
                ? "Ketuk baris untuk chat · ketuk avatar untuk profil"
                : "Belum ada teman. Gunakan kotak cari di atas untuk menemukan member lain."}
            </p>
          ) : null}
          {q && q.length < 2 ? (
            <p className="px-1 py-2 text-xs text-broker-muted">Ketik minimal 2 huruf untuk mencari member.</p>
          ) : null}
          {q && q.length >= 2 && searchLoading && !hasResults ? (
            <p className="px-1 py-2 text-xs text-broker-muted">Mencari member…</p>
          ) : null}
          {q && q.length >= 2 && !searchLoading && !hasResults ? (
            <p className="px-1 py-2 text-xs text-broker-muted">Tidak ada member yang cocok.</p>
          ) : null}
          {combinedPeers.map((p, idx) => {
            const raw = (p.name ?? p.email ?? "?").trim();
            const short = raw.split(/\s+/)[0]?.slice(0, 24) ?? "?";
            const isLocal = idx < localCount;
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <SmallUserAvatar name={p.name} image={p.image ?? null} size="md" />
                    {p.online ? (
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-broker-surface bg-broker-accent"
                      />
                    ) : null}
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPeerId(p.id);
                    onMessengerPeerSelect?.(p.id);
                    if (isMessenger) setMobileShowMemberList(false);
                  }}
                  title={raw + (p.online ? " · Online" : "")}
                  className="flex min-w-0 flex-1 flex-col items-start text-left"
                >
                  <span className="min-w-0 max-w-full truncate text-sm font-medium text-white">{short}</span>
                  <span className="text-[10px] text-broker-muted">
                    {isLocal ? (p.online ? "Aktif sekarang" : "Teman") : "Kirim permintaan chat"}
                  </span>
                </button>
              </div>
            );
          })}
        </aside>
      </div>
    );
  }

  const narrowPrivateMemberList =
    isMessenger && mode === "private" && peers.length > 0 && mobileShowMemberList;

  const messengerThreadPeerBar =
    isMessenger && mode === "private" && peerId && !mobileShowMemberList
      ? (() => {
          const active =
            peers.find((p) => p.id === peerId) ?? searchResults.find((p) => p.id === peerId);
          if (!active) return null;
          const label = (active.name ?? active.email ?? "?").trim();
          const href = peerPublicProfileHref(active);
          return (
            <div className="flex shrink-0 items-center gap-2 border-b border-broker-border bg-broker-surface px-2 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => setMobileShowMemberList(true)}
                aria-label="Kembali ke daftar member"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-broker-accent transition hover:bg-broker-bg/50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <a
                href={href}
                className="shrink-0 rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-broker-accent/60"
                title={`Buka profil publik — ${label}`}
              >
                <div className="relative">
                  <SmallUserAvatar name={active.name} image={active.image ?? null} size="md" />
                  {active.online ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-broker-surface bg-broker-accent"
                    />
                  ) : null}
                </div>
              </a>
              <a
                href={href}
                className="flex min-w-0 flex-1 flex-col items-start text-left hover:underline"
                title={`Buka profil publik — ${label}`}
              >
                <span className="min-w-0 max-w-full truncate text-sm font-semibold text-white">{label}</span>
                <span className="text-[10px] text-broker-muted">
                  {active.online ? "Aktif sekarang" : "Lihat profil"}
                </span>
              </a>
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
                ? "relative flex shrink-0 items-center gap-1 rounded-full border border-broker-border bg-broker-surface px-1.5 py-1.5 shadow-md"
                : "relative flex gap-2"
            }
          >
            <input
              ref={inputRef}
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
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              aria-label="Pilih emoji"
              title="Pilih emoji"
              className={
                isMessenger
                  ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-broker-muted transition hover:bg-broker-bg hover:text-white"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-broker-muted transition hover:bg-broker-surface hover:text-white"
              }
            >
              <span aria-hidden>😊</span>
            </button>
            <ChatEmojiPicker
              open={showEmoji}
              onClose={() => setShowEmoji(false)}
              onPick={(e) => {
                setBody((b) => b + e);
                inputRef.current?.focus();
              }}
              anchorClassName={isMessenger ? "bottom-12 right-1" : "bottom-12 right-0"}
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Kirim pesan"
              className={
                isMessenger
                  ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-broker-accent text-broker-bg disabled:opacity-50"
                  : "shrink-0 rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
              }
            >
              {isMessenger ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              ) : (
                "Kirim"
              )}
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
