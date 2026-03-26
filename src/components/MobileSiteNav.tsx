"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

export type MobileNavLink = { href: string; label: string };

export function MobileSiteNav({ links }: { links: MobileNavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-broker-border bg-broker-surface/80 text-broker-muted transition hover:border-broker-accent/40 hover:bg-broker-surface hover:text-white"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Tutup menu" : "Buka menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="fixed right-0 top-16 z-50 max-h-[calc(100vh-4rem)] w-[min(100vw,18rem)] overflow-y-auto border-l border-b border-broker-border bg-broker-surface py-3 shadow-xl"
          >
            <ul className="flex flex-col gap-0.5 px-2">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2.5 text-sm text-broker-muted transition hover:bg-broker-surface hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
