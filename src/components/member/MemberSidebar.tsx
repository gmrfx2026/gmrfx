"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CommunityNavEmbedded,
  getCommunityNavLinks,
  PortfolioNavEmbedded,
} from "@/components/portfolio/PortfolioSubNav";
import type { MemberMenuResolvedItem } from "@/lib/memberMenu";
import type { PortfolioNavConfig } from "@/lib/portfolioMenu";
import clsx from "clsx";

function getActiveTab(pathname: string, tab: string | null): string {
  if (pathname.startsWith("/profil/portfolio")) return "portfolio";
  if (pathname.startsWith("/profil/artikel/baru")) return "artikel";
  if (pathname.startsWith("/profil/wallet")) return "wallet";
  return tab ?? "home";
}

const WALLET_SUB_LINKS = [
  { href: "/profil?tab=wallet", label: "Ringkasan", matchFn: (p: string, t: string | null) => p === "/profil" && t === "wallet" },
  { href: "/profil/wallet/rekening", label: "Rekening & Dompet", matchFn: (p: string) => p.startsWith("/profil/wallet/rekening") },
  { href: "/profil/wallet/penarikan", label: "Penarikan Saldo", matchFn: (p: string) => p.startsWith("/profil/wallet/penarikan") },
];

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
  const communityDockLinks = useMemo(() => getCommunityNavLinks(portfolioMenu), [portfolioMenu]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const mobileDock =
    mounted &&
    createPortal(
      <div className="md:hidden">
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
                      </Link>
                    </div>
                  );
                })}
                {communityDockLinks.length > 0 ? (
                  <>
                    <div
                      className="mx-0.5 w-px shrink-0 self-stretch bg-broker-border/50"
                      aria-hidden
                      role="separator"
                    />
                    {communityDockLinks.map(({ href, label }) => {
                      const commActive =
                        pathname === href || pathname.startsWith(`${href}/`);
                      return (
                        <div key={href} className="shrink-0">
                          <Link
                            href={href}
                            className={[
                              "flex max-w-[9.5rem] flex-col items-center justify-center rounded-xl px-2.5 py-2 text-center text-xs font-medium leading-tight transition",
                              commActive
                                ? "bg-broker-accent/15 text-broker-accent ring-1 ring-broker-accent/35"
                                : "text-broker-muted hover:bg-broker-bg/60 hover:text-white",
                            ].join(" ")}
                          >
                            <span className="line-clamp-2">{label}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </>
                ) : null}
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
                return (
                  <Fragment key={it.key}>
                    <NavLinkRow it={it} active={active} badge={null} />

                    {/* Sub-nav Portofolio — hanya PortfolioNavEmbedded, tanpa Komunitas */}
                    {it.key === "portfolio" && (
                      <div className="ml-2 mt-0.5 space-y-0 border-l border-broker-border/50 pl-2">
                        <PortfolioNavEmbedded menu={portfolioMenu} nested />
                      </div>
                    )}

                    {/* Sub-nav Wallet — muncul tepat di bawah item Wallet & Transfer */}
                    {it.key === "wallet" && activeTab === "wallet" && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-broker-border/50 pl-2">
                        {WALLET_SUB_LINKS.map((l) => {
                          const isActive = l.matchFn(pathname, tab);
                          return (
                            <Link
                              key={l.href}
                              href={l.href}
                              className={[
                                "block rounded-lg px-3 py-1.5 text-[13px] leading-snug transition",
                                isActive
                                  ? "bg-broker-accent/15 font-medium text-broker-accent ring-1 ring-broker-accent/35"
                                  : "text-broker-muted hover:bg-broker-bg/50 hover:text-white",
                              ].join(" ")}
                            >
                              {l.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </nav>

            {/* Komunitas — seksi tersendiri di bawah menu member */}
            <CommunityNavEmbedded menu={portfolioMenu} />
          </div>

        </aside>
      </div>
    </>
  );
}
