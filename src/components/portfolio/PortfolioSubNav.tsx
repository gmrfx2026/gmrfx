"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { PortfolioNavConfig } from "@/lib/portfolioMenu";

function SubNavLink({
  href,
  label,
  indent,
  isActive,
  compact,
}: {
  href: string;
  label: string;
  indent?: boolean;
  isActive: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-lg transition",
        compact ? "px-2.5 py-1.5 text-[13px] leading-snug" : "px-3 py-2 text-sm",
        indent && (compact ? "pl-5" : "pl-6"),
        isActive
          ? "bg-broker-accent/15 font-medium text-broker-accent ring-1 ring-broker-accent/35"
          : "text-broker-muted hover:bg-broker-bg/50 hover:text-white"
      )}
    >
      {label}
    </Link>
  );
}

function SectionToggle({
  open,
  onToggle,
  label,
  compact,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "flex w-full items-center justify-between rounded-lg text-left font-semibold uppercase tracking-wider text-broker-muted transition hover:bg-broker-bg/40 hover:text-white",
        compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs"
      )}
    >
      <span>{label}</span>
      <span className="text-broker-muted/80" aria-hidden>
        {open ? "−" : "+"}
      </span>
    </button>
  );
}

const COMM_KEYS = [
  "community_accounts",
  "community_following",
  "community_my_followers",
  "community_publish",
] as const;
const MID_KEYS = ["journal", "trade_log", "playbook"] as const;

type CommKey = (typeof COMM_KEYS)[number];
type MidKey = (typeof MID_KEYS)[number];

function hrefForPortfolioKey(
  key: "dashboard" | "summary" | MidKey | CommKey
): string {
  switch (key) {
    case "dashboard":
      return "/profil/portfolio/dashboard";
    case "summary":
      return "/profil/portfolio/summary";
    case "journal":
      return "/profil/portfolio/journal";
    case "trade_log":
      return "/profil/portfolio/trade-log";
    case "playbook":
      return "/profil/portfolio/playbook";
    case "community_accounts":
      return "/profil/portfolio/community/accounts";
    case "community_following":
      return "/profil/portfolio/community/following";
    case "community_my_followers":
      return "/profil/portfolio/community/pengikut";
    case "community_publish":
      return "/profil/portfolio/community/publish";
    default:
      return "/profil/portfolio/dashboard";
  }
}

/** Sub-menu Komunitas di kartu Member menu (desktop), terpisah dari blok Portofolio MT. */
export function CommunityNavEmbedded({ menu }: { menu: PortfolioNavConfig }) {
  const pathname = usePathname();

  const commSorted = useMemo(
    () =>
      COMM_KEYS.filter((k) => menu[k].enabled).sort(
        (a, b) => menu[a].sortOrder - menu[b].sortOrder || a.localeCompare(b)
      ),
    [menu]
  );

  const commAccountsActive = pathname.startsWith("/profil/portfolio/community/accounts");
  const commFollowingActive = pathname.startsWith("/profil/portfolio/community/following");
  const commMyFollowersActive = pathname.startsWith("/profil/portfolio/community/pengikut");
  const commPublishActive = pathname.startsWith("/profil/portfolio/community/publish");

  function isCommActive(k: CommKey): boolean {
    if (k === "community_accounts") return commAccountsActive;
    if (k === "community_following") return commFollowingActive;
    if (k === "community_my_followers") return commMyFollowersActive;
    return commPublishActive;
  }

  if (commSorted.length === 0) return null;

  return (
    <div className="mt-3 border-t border-broker-border/50 pt-3">
      <div className="px-2 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-accent">Komunitas</p>
      </div>
      <nav className="space-y-0.5" aria-label="Submenu komunitas">
        {commSorted.map((k) => (
          <SubNavLink
            key={k}
            href={hrefForPortfolioKey(k)}
            label={menu[k].label}
            isActive={isCommActive(k)}
            compact
          />
        ))}
      </nav>
    </div>
  );
}

/** Sub-menu portofolio di dalam kartu Member menu (desktop). */
export function PortfolioNavEmbedded({ menu }: { menu: PortfolioNavConfig }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedMtLogin = (searchParams.get("mtLogin") ?? "").trim();

  const [mtLogins, setMtLogins] = useState<string[] | null>(null);

  const showPortfolioBlock = menu.summary.enabled || menu.mt_linked_logins.enabled;

  const [portfolioOpen, setPortfolioOpen] = useState(() =>
    pathname.startsWith("/profil/portfolio/summary")
  );

  const inPortfolio = pathname.startsWith("/profil/portfolio");
  const dashActive = pathname === "/profil/portfolio" || pathname === "/profil/portfolio/dashboard";
  const summaryActive = pathname.startsWith("/profil/portfolio/summary");
  const journalActive = pathname.startsWith("/profil/portfolio/journal");
  const tradeLogActive = pathname.startsWith("/profil/portfolio/trade-log");
  const tradeLogAllActive = tradeLogActive && selectedMtLogin.length === 0;
  const playbookActive = pathname.startsWith("/profil/portfolio/playbook");
  const midSorted = useMemo(
    () =>
      MID_KEYS.filter((k) => menu[k].enabled).sort(
        (a, b) => menu[a].sortOrder - menu[b].sortOrder || a.localeCompare(b)
      ),
    [menu]
  );

  useEffect(() => {
    if (!pathname.startsWith("/profil/portfolio")) {
      setMtLogins(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/profile/mt5-linked-accounts", { cache: "no-store" });
        if (!r.ok) {
          if (!cancelled) setMtLogins([]);
          return;
        }
        const j = (await r.json()) as { mtLogins?: string[] };
        if (!cancelled) setMtLogins(Array.isArray(j.mtLogins) ? j.mtLogins : []);
      } catch {
        if (!cancelled) setMtLogins([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!inPortfolio) return null;

  function isMidActive(k: MidKey): boolean {
    if (k === "journal") return journalActive;
    if (k === "trade_log") return tradeLogAllActive;
    return playbookActive;
  }

  return (
    <div className="mt-3 border-t border-broker-border/50 pt-3">
      <div className="px-2 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-accent">Portofolio MT</p>
      </div>

      <nav className="space-y-0.5" aria-label="Submenu portofolio">
        {menu.dashboard.enabled ? (
          <SubNavLink
            href={hrefForPortfolioKey("dashboard")}
            label={menu.dashboard.label}
            isActive={dashActive}
            compact
          />
        ) : null}

        {showPortfolioBlock ? (
          <div className="pt-0.5">
            <SectionToggle
              open={portfolioOpen}
              onToggle={() => setPortfolioOpen((o) => !o)}
              label="Portofolio"
              compact
            />
            {portfolioOpen && (
              <div className="mt-0.5 space-y-0.5 border-l border-broker-border/40 pl-1.5">
                {menu.summary.enabled ? (
                  <SubNavLink
                    href={hrefForPortfolioKey("summary")}
                    label={menu.summary.label}
                    indent
                    isActive={summaryActive}
                    compact
                  />
                ) : null}
                {menu.mt_linked_logins.enabled ? (
                  mtLogins === null ? (
                    <p className="px-2.5 pt-0.5 text-[9px] leading-tight text-broker-muted/55">
                      Memuat daftar akun…
                    </p>
                  ) : mtLogins.length === 0 ? (
                    <p className="px-2.5 pt-0.5 text-[9px] leading-tight text-broker-muted/55">
                      Nomor akun muncul setelah EA terhubung.
                    </p>
                  ) : (
                    <div className="mt-0.5 space-y-0.5">
                      {mtLogins.map((login) => (
                        <SubNavLink
                          key={login}
                          href={`/profil/portfolio/dashboard?mtLogin=${encodeURIComponent(login)}`}
                          label={login}
                          indent
                          isActive={
                            pathname.startsWith("/profil/portfolio/dashboard") && selectedMtLogin === login
                          }
                          compact
                        />
                      ))}
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {midSorted.map((k) => (
          <SubNavLink
            key={k}
            href={hrefForPortfolioKey(k)}
            label={menu[k].label}
            isActive={isMidActive(k)}
            compact
          />
        ))}
      </nav>
    </div>
  );
}

/** Strip navigasi horizontal untuk layar sempit. */
export function PortfolioNavMobileStrip({ menu }: { menu: PortfolioNavConfig }) {
  const pathname = usePathname();
  if (!pathname.startsWith("/profil/portfolio")) return null;

  const links: { href: string; label: string }[] = [];
  if (menu.dashboard.enabled) {
    links.push({ href: hrefForPortfolioKey("dashboard"), label: menu.dashboard.label });
  }
  if (menu.summary.enabled) {
    links.push({ href: hrefForPortfolioKey("summary"), label: menu.summary.label });
  }
  for (const k of MID_KEYS.filter((x) => menu[x].enabled).sort(
    (a, b) => menu[a].sortOrder - menu[b].sortOrder
  )) {
    links.push({ href: hrefForPortfolioKey(k), label: menu[k].label });
  }

  if (links.length === 0) return null;

  return (
    <div className="rounded-xl border border-broker-border/70 bg-broker-surface/90 p-2 shadow-md shadow-black/30 backdrop-blur-sm">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-broker-accent">
        Portofolio MT
      </p>
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="navigation"
        aria-label="Submenu portofolio"
      >
        {links.map(({ href, label }) => {
          const active =
            href === "/profil/portfolio/dashboard"
              ? pathname === "/profil/portfolio" || pathname === href
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition",
                active
                  ? "bg-broker-accent/15 text-broker-accent ring-1 ring-broker-accent/35"
                  : "border border-broker-border/50 bg-broker-bg/40 text-broker-muted hover:text-white"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
