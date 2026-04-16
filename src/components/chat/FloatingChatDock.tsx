"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { playChatIncomingBeep, readChatBeepPreference } from "@/lib/chatBeep";
import { ProfilChatBox, type ChatPeer } from "@/components/ProfilChatBox";
import clsx from "clsx";
import styles from "./FloatingChatDock.module.css";

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
  );
}

function FloatingChatDockInner({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [peers, setPeers] = useState<ChatPeer[]>([]);
  const [unread, setUnread] = useState(0);
  /** Portal ke body: hindari ancestor `overflow-x-hidden` / transform yang membuat fixed “nyasar”. */
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const peerFromUrl = searchParams.get("peerId");
  const initialMode = searchParams.get("chatMode") === "public" ? "public" : "private";

  useEffect(() => {
    if (searchParams.get("messenger") !== "1") return;
    setOpen(true);
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("messenger");
    const q = sp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const loadPeers = useCallback(async () => {
    const q = peerFromUrl ? `?peerId=${encodeURIComponent(peerFromUrl)}` : "";
    try {
      const r = await fetch(`/api/chat/peers${q}`, { credentials: "same-origin" });
      const data = (await r.json().catch(() => ({}))) as { peers?: ChatPeer[] };
      setPeers(Array.isArray(data.peers) ? data.peers : []);
    } catch {
      setPeers([]);
    }
  }, [peerFromUrl]);

  useEffect(() => {
    if (!open) return;
    void loadPeers();
  }, [open, loadPeers]);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const r = await fetch("/api/chat/unread-count", { credentials: "same-origin" });
        if (!r.ok) return;
        const j = (await r.json()) as { unread?: number };
        const next = Number(j?.unread ?? 0);
        if (cancelled) return;
        setUnread(next);
        if (next > prevUnreadRef.current && readChatBeepPreference()) {
          playChatIncomingBeep();
        }
        prevUnreadRef.current = next;
      } catch {
        /* ignore */
      }
    }
    void tick();
    const id = window.setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const onProfilMobile = pathname.startsWith("/profil");

  const dock = (
    <div className={styles.anchor} dir="ltr">
      {open ? (
        <div
          className={clsx(
            styles.panel,
            onProfilMobile && styles.panelProfilOffset,
            "flex w-[min(100vw-1.5rem,380px)] max-w-[100vw] flex-col overflow-hidden rounded-t-2xl border border-broker-border bg-broker-surface shadow-2xl shadow-black/50 md:rounded-2xl",
            "h-[min(72vh,520px)]",
          )}
          role="dialog"
          aria-label="Chat"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-broker-border bg-broker-bg px-3 py-2.5">
            <p className="text-sm font-semibold text-white">Pesan</p>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-lg leading-none text-broker-muted transition hover:bg-broker-surface hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 border-t border-broker-border/60 bg-broker-bg">
            <ProfilChatBox
              peers={peers}
              selfId={userId}
              initialPeerId={peerFromUrl ?? undefined}
              initialMode={initialMode}
              variant="messenger"
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          styles.fab,
          onProfilMobile && styles.fabProfilOffset,
          "flex h-14 w-14 items-center justify-center rounded-full border border-broker-border bg-gradient-to-br from-broker-accent to-broker-accentDim text-broker-bg shadow-lg shadow-black/40 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-broker-accent focus-visible:ring-offset-2 focus-visible:ring-offset-broker-bg relative",
          open ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100",
        )}
        aria-label={open ? "Tutup chat" : "Buka chat"}
      >
        <ChatBubbleIcon className="h-7 w-7" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-broker-danger px-1 text-[10px] font-bold text-white shadow-sm">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
    </div>
  );

  if (!portalRoot) return null;
  return createPortal(dock, portalRoot);
}

export function FloatingChatDock({ userId }: { userId: string }) {
  return (
    <Suspense fallback={null}>
      <FloatingChatDockInner userId={userId} />
    </Suspense>
  );
}
