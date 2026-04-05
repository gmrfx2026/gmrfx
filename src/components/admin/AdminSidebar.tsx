"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ADMIN_NAV_GROUPS } from "@/lib/adminNavLinks";

function activeHref(pathname: string): string | null {
  const allItems = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
  const sorted = [...allItems].sort((a, b) => b.href.length - a.href.length);
  for (const l of sorted) {
    if (pathname === l.href || pathname.startsWith(`${l.href}/`)) return l.href;
  }
  return null;
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      className="h-4.5 w-4.5 shrink-0"
      style={{ width: "1.125rem", height: "1.125rem" }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function SidebarContent({ current, siteName, onClose }: { current: string | null; siteName: string; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-sm">
          {siteName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">{siteName}</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-400">Admin</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigasi admin">
        <div className="space-y-5">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = current === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                        ].join(" ")}
                      >
                        <NavIcon d={item.icon} />
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke situs
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({ siteName }: { siteName: string }) {
  const pathname = usePathname() ?? "";
  const current  = activeHref(pathname);
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);
  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:bg-slate-900 lg:border-r lg:border-white/[0.06]">
        <SidebarContent current={current} siteName={siteName} />
      </aside>

      {/* ── Mobile: topbar trigger ── */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-bold tracking-tight text-slate-900">
          {siteName} <span className="font-semibold text-emerald-600">Admin</span>
        </span>
      </div>

      {/* ── Mobile overlay + drawer ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-bold text-white">Menu Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent current={current} siteName={siteName} onClose={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
