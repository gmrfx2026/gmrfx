"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

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

/** Sub-menu portofolio di dalam kartu Member menu (desktop). */
export function PortfolioNavEmbedded() {
  const pathname = usePathname();
  const [portfolioOpen, setPortfolioOpen] = useState(() =>
    pathname.startsWith("/profil/portfolio/summary")
  );
  const [communityOpen, setCommunityOpen] = useState(() =>
    pathname.startsWith("/profil/portfolio/community")
  );

  const inPortfolio = pathname.startsWith("/profil/portfolio");
  const dashActive = pathname === "/profil/portfolio" || pathname === "/profil/portfolio/dashboard";
  const summaryActive = pathname.startsWith("/profil/portfolio/summary");
  const journalActive = pathname.startsWith("/profil/portfolio/journal");
  const tradeLogActive = pathname.startsWith("/profil/portfolio/trade-log");
  const playbookActive = pathname.startsWith("/profil/portfolio/playbook");
  const commAccountsActive = pathname.startsWith("/profil/portfolio/community/accounts");
  const commFollowingActive = pathname.startsWith("/profil/portfolio/community/following");

  if (!inPortfolio) return null;

  return (
    <div className="mt-3 border-t border-broker-border/50 pt-3">
      <div className="px-2 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-broker-accent">Portofolio MT</p>
        <p className="mt-0.5 text-[10px] leading-snug text-broker-muted">
          Jurnal, trade log, komunitas — data dari EA menyusul.
        </p>
      </div>

      <nav className="space-y-0.5" aria-label="Submenu portofolio">
        <SubNavLink
          href="/profil/portfolio/dashboard"
          label="Dashboard"
          isActive={dashActive}
          compact
        />

        <div className="pt-0.5">
          <SectionToggle
            open={portfolioOpen}
            onToggle={() => setPortfolioOpen((o) => !o)}
            label="Portofolio"
            compact
          />
          {portfolioOpen && (
            <div className="mt-0.5 space-y-0.5 border-l border-broker-border/40 pl-1.5">
              <p className="px-2.5 py-0.5 text-[9px] uppercase tracking-wide text-broker-muted/70">
                Akun MT (EA)
              </p>
              <SubNavLink
                href="/profil/portfolio/summary"
                label="Ringkasan"
                indent
                isActive={summaryActive}
                compact
              />
              <p className="px-2.5 pt-0.5 text-[9px] leading-tight text-broker-muted/55">
                Nomor akun muncul setelah EA terhubung.
              </p>
            </div>
          )}
        </div>

        <SubNavLink href="/profil/portfolio/journal" label="Jurnal" isActive={journalActive} compact />
        <SubNavLink href="/profil/portfolio/trade-log" label="Trade log" isActive={tradeLogActive} compact />
        <SubNavLink href="/profil/portfolio/playbook" label="Playbook" isActive={playbookActive} compact />

        <div className="pt-0.5">
          <SectionToggle
            open={communityOpen}
            onToggle={() => setCommunityOpen((o) => !o)}
            label="Komunitas"
            compact
          />
          {communityOpen && (
            <div className="mt-0.5 space-y-0.5 border-l border-broker-border/40 pl-1.5">
              <SubNavLink
                href="/profil/portfolio/community/accounts"
                label="Akun"
                indent
                isActive={commAccountsActive}
                compact
              />
              <SubNavLink
                href="/profil/portfolio/community/following"
                label="Mengikuti (copy)"
                indent
                isActive={commFollowingActive}
                compact
              />
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

const MOBILE_LINKS: { href: string; label: string }[] = [
  { href: "/profil/portfolio/dashboard", label: "Dashboard" },
  { href: "/profil/portfolio/summary", label: "Ringkasan" },
  { href: "/profil/portfolio/journal", label: "Jurnal" },
  { href: "/profil/portfolio/trade-log", label: "Trade log" },
  { href: "/profil/portfolio/playbook", label: "Playbook" },
  { href: "/profil/portfolio/community/accounts", label: "Akun" },
  { href: "/profil/portfolio/community/following", label: "Mengikuti" },
];

/** Strip navigasi horizontal untuk layar sempit (sub-menu tidak ada di dock bawah). */
export function PortfolioNavMobileStrip() {
  const pathname = usePathname();
  if (!pathname.startsWith("/profil/portfolio")) return null;

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
        {MOBILE_LINKS.map(({ href, label }) => {
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
