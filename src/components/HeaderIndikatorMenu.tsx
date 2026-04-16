"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export function HeaderIndikatorMenu({
  label,
  items,
  adminAccent,
}: {
  label: string;
  items: { href: string; label: string }[];
  adminAccent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  const btnClass = [
    "flex items-center gap-1 rounded-md px-3 py-2 text-sm transition hover:bg-broker-surface",
    adminAccent ? "font-medium text-broker-gold hover:text-broker-gold" : "text-broker-muted hover:text-white",
  ].join(" ");

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        id={btnId}
        className={btnClass}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {label}
        <span className="text-[10px] opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          role="menu"
          aria-labelledby={btnId}
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-md border border-broker-border bg-broker-surface py-1 shadow-lg"
        >
          {items.map((it) => (
            <li key={it.href} role="none">
              <Link
                role="menuitem"
                href={it.href}
                className="block px-3 py-2 text-sm text-broker-muted transition hover:bg-broker-bg hover:text-white"
                onClick={() => setOpen(false)}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
