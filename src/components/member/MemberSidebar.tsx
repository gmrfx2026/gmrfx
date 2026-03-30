"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playChatIncomingBeep, readChatBeepPreference } from "@/lib/chatBeep";
import { PortfolioNavEmbedded } from "@/components/portfolio/PortfolioSubNav";
import type { MemberMenuResolvedItem } from "@/lib/memberMenu";
import type { PortfolioNavConfig } from "@/lib/portfolioMenu";
import clsx from "clsx";

function getActiveTab(pathname: string, tab: string | null): string {
  if (pathname.startsWith("/profil/portfolio")) return "portfolio";
  if (pathname.startsWith("/profil/artikel/baru")) return "artikel";
  return tab ?? "home";
}

function NavLinkRow({
  it,
  active,
  badge,
}: {
  it: MemberMenuResolvedItem;
  active: boolean;
  badge: number | null;
}) {
  return (
    <Link
      href={it.href}
      className={[
        "flex min-w-0 items-center rounded-xl px-3 py-2 text-sm transition",
        active
          ? "bg-broker-accent/15 text-broker-accent ring-1 ring-broker-accent/35"
          : "text-broker-muted hover:bg-broker-bg/50 hover:text-white",
      ].join(" ")}
    >
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate">{it.label}</span>
        {badge != null && (
          <span className="shrink-0 rounded-full bg-broker-accent/25 px-2 py-0.5 text-xs font-semibold text-broker-accent">
            {badge}
          </span>
        )}
      </span>
    </Link>
  );
}

export function MemberSidebar({
  items,
  portfolioMenu,
}: {
  items: MemberMenuResolvedItem[];
  portfolioMenu: PortfolioNavConfig;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = getActiveTab(pathname, tab);

  const [chatUnread, setChatUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const prevChatUnreadRef = useRef(0);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      let nextChat = 0;
      try {
        const r = await fetch("/api/chat/unread-count");
        if (r.ok) {
          const j = (await r.json()) as { unread?: number };
          nextChat = Number(j?.unread ?? 0);
        }
      } catch {
        /* ignore */
      }

      if (cancelled) return;

      setChatUnread(nextChat);

      if (nextChat > prevChatUnreadRef.current) {
        setToast(`Ada chat baru (${nextChat}).`);
        if (readChatBeepPreference()) {
          playChatIncomingBeep();
        }
        prevChatUnreadRef.current = nextChat;
        setTimeout(() => {
          setToast((t) => (t && t.startsWith("Ada chat baru") ? null : t));
        }, 3500);
      } else {
        prevChatUnreadRef.current = nextChat;
      }
    }

    void loadCounts();
    const interval = window.setInterval(() => {
      void loadCounts();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const mobileDock =
    mounted &&
    createPortal(
      <div className="md:hidden">
        {toast && (
          <div
            className="fixed left-3 right-3 z-50 rounded-xl border border-broker-border/80 bg-broker-surface/95 px-3 py-2 text-center text-sm text-white shadow-lg ring-1 ring-white/5 backdrop-blur-md"
            style={{ bottom: "max(5.5rem, calc(5rem + env(safe-area-inset-bottom)))" }}
          >
            {toast}
          </div>
        )}
        <nav
          aria-label="Menu member"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto mx-auto max-w-6xl px-3">
            <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/95 py-2 pl-2 pr-1 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-md">
              <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((it) => {
                  const active = it.key === activeTab;
                  const badge = it.key === "chat" && chatUnread > 0 ? chatUnread : null;
                  return (
                    <div key={it.key} className="shrink-0">
                      <Link
                        href={it.href}
                        className={[
                          "flex max-w-[9.5rem] flex-col items-center justify-center rounded-xl px-2.5 py-2 text-center text-xs font-medium leading-tight transition",
                          active
                            ? "bg-broker-accent/15 text-broker-accent ring-1 ring-broker-accent/35"
                            : "text-broker-muted hover:bg-broker-bg/60 hover:text-white",
                        ].join(" ")}
                      >
                        <span className="line-clamp-2">{it.label}</span>
                        {badge != null && (
                          <span className="mt-1 rounded-full bg-broker-accent/25 px-1.5 py-px text-[10px] font-semibold text-broker-accent">
                            {badge}
                          </span>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </div>,
      document.body,
    );

  return (
    <>
      {mobileDock}

      <div
        className={clsx(
          "hidden shrink-0 md:block",
          pathname.startsWith("/profil/portfolio") ? "w-[17.5rem]" : "w-64"
        )}
      >
        <aside className="sticky top-24 w-full">
          <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/95 p-3 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-sm">
            <div className="px-2 py-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-broker-accent">
                Member menu
              </p>
            </div>

            <nav className="mt-2 space-y-1">
              {items.map((it) => {
                const active = it.key === activeTab;
                const badge = it.key === "chat" && chatUnread > 0 ? chatUnread : null;
                return <NavLinkRow key={it.key} it={it} active={active} badge={badge} />;
              })}
            </nav>

            <PortfolioNavEmbedded menu={portfolioMenu} />
          </div>

          {toast && (
            <div className="mt-3 hidden rounded-xl border border-broker-border/80 bg-broker-surface/90 px-3 py-2 text-sm text-white shadow-lg md:block">
              {toast}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
