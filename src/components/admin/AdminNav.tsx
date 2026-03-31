"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_LINKS } from "@/lib/adminNavLinks";

/** Satu item menu aktif: prioritas path terpanjang (mis. /admin/members/online, bukan /admin/members). */
function activeHref(pathname: string): string | null {
  const sorted = [...ADMIN_NAV_LINKS].sort((a, b) => b.href.length - a.href.length);
  for (const l of sorted) {
    if (pathname === l.href || pathname.startsWith(`${l.href}/`)) return l.href;
  }
  return null;
}

export function AdminNav() {
  const pathname = usePathname() ?? "";
  const current = activeHref(pathname);

  return (
    <nav
      aria-label="Menu admin"
      className="flex min-w-0 flex-1 flex-wrap gap-1 sm:gap-1.5 lg:justify-center"
    >
      {ADMIN_NAV_LINKS.map((l) => {
        const active = current === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={[
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 shadow-sm shadow-emerald-900/5"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
