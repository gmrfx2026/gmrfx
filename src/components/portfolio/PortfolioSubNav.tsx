"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

function NavLink({
  href,
  label,
  indent,
  isActive,
}: {
  href: string;
  label: string;
  indent?: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-lg px-3 py-2 text-sm transition",
        indent && "pl-6",
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
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-broker-muted transition hover:bg-broker-bg/40 hover:text-white"
    >
      <span>{label}</span>
      <span className="text-broker-muted/80" aria-hidden>
        {open ? "−" : "+"}
      </span>
    </button>
  );
}

export function PortfolioSubNav() {
  const pathname = usePathname();
  const [portfolioOpen, setPortfolioOpen] = useState(
    () => pathname.startsWith("/profil/portfolio/summary")
  );
  const [communityOpen, setCommunityOpen] = useState(() => pathname.startsWith("/profil/portfolio/community"));

  const dashActive = pathname === "/profil/portfolio" || pathname === "/profil/portfolio/dashboard";
  const summaryActive = pathname.startsWith("/profil/portfolio/summary");
  const journalActive = pathname.startsWith("/profil/portfolio/journal");
  const tradeLogActive = pathname.startsWith("/profil/portfolio/trade-log");
  const playbookActive = pathname.startsWith("/profil/portfolio/playbook");
  const commAccountsActive = pathname.startsWith("/profil/portfolio/community/accounts");
  const commFollowingActive = pathname.startsWith("/profil/portfolio/community/following");

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-56 xl:w-60">
      <div className="rounded-2xl border border-broker-border/80 bg-broker-surface/95 p-3 shadow-xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-sm">
        <div className="px-2 py-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-broker-accent">Portofolio MT</p>
          <p className="mt-1 text-[11px] leading-snug text-broker-muted">
            Jurnal trading, log transaksi, dan komunitas — alur mirip referensi, tema GMR FX.
          </p>
        </div>

        <nav className="mt-2 space-y-0.5 border-t border-broker-border/50 pt-3" aria-label="Menu portofolio">
          <NavLink href="/profil/portfolio/dashboard" label="Dashboard" isActive={dashActive} />

          <div className="pt-1">
            <SectionToggle
              open={portfolioOpen}
              onToggle={() => setPortfolioOpen((o) => !o)}
              label="Portofolio"
            />
            {portfolioOpen && (
              <div className="mt-1 space-y-0.5 border-l border-broker-border/40 pl-2">
                <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-broker-muted/70">
                  Akun MT (EA)
                </p>
                <NavLink href="/profil/portfolio/summary" label="Ringkasan" indent isActive={summaryActive} />
                <p className="px-3 pt-1 text-[10px] text-broker-muted/60">
                  Setelah EA terhubung, nomor akun akan muncul di sini.
                </p>
              </div>
            )}
          </div>

          <NavLink href="/profil/portfolio/journal" label="Jurnal" isActive={journalActive} />
          <NavLink href="/profil/portfolio/trade-log" label="Trade log" isActive={tradeLogActive} />
          <NavLink href="/profil/portfolio/playbook" label="Playbook" isActive={playbookActive} />

          <div className="pt-1">
            <SectionToggle
              open={communityOpen}
              onToggle={() => setCommunityOpen((o) => !o)}
              label="Komunitas"
            />
            {communityOpen && (
              <div className="mt-1 space-y-0.5 border-l border-broker-border/40 pl-2">
                <NavLink
                  href="/profil/portfolio/community/accounts"
                  label="Akun"
                  indent
                  isActive={commAccountsActive}
                />
                <NavLink
                  href="/profil/portfolio/community/following"
                  label="Mengikuti (copy)"
                  indent
                  isActive={commFollowingActive}
                />
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}
