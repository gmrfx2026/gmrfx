"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { playChatIncomingBeep, readChatBeepPreference } from "@/lib/chatBeep";
import { ProfilChatBox, type ChatPeer } from "@/components/ProfilChatBox";
import clsx from "clsx";

function FloatingChatDockInner({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [peers, setPeers] = useState<ChatPeer[]>([]);
  const [unread, setUnread] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const prevUnreadRef = useRef(0);

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

  return (
    <>
      {open ? (
        <div
          className={clsx(
            "fixed z-[55] flex w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl shadow-black/25 md:rounded-2xl",
            onProfilMobile
              ? "bottom-[max(5.5rem,5rem+env(safe-area-inset-bottom))] right-3 h-[min(72vh,520px)]"
              : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 h-[min(72vh,520px)] md:bottom-6 md:right-6",
          )}
          role="dialog"
          aria-label="Chat"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-[#0084FF] px-3 py-2 text-white">
            <p className="text-sm font-semibold">Pesan</p>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-lg leading-none hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1">
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
          "fixed z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-[#0084FF] text-2xl text-white shadow-lg shadow-black/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0084FF] relative",
          onProfilMobile
            ? "bottom-[max(5.5rem,5rem+env(safe-area-inset-bottom))] right-3"
            : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 md:bottom-6 md:right-6",
          open ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100",
        )}
        aria-label={open ? "Tutup chat" : "Buka chat"}
      >
        <span aria-hidden>💬</span>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
    </>
  );
}

export function FloatingChatDock({ userId }: { userId: string }) {
  return (
    <Suspense fallback={null}>
      <FloatingChatDockInner userId={userId} />
    </Suspense>
  );
}
