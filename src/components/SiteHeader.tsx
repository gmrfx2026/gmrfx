import Link from "next/link";
import { auth } from "@/auth";
import { HeaderAuth } from "./HeaderAuth";
import { MobileSiteNav } from "./MobileSiteNav";
import { NotificationBell } from "./NotificationBell";
import { getResolvedSiteHeaderNavItems } from "@/lib/siteHeaderNav";

export async function SiteHeader() {
  const session = await auth();
  const navItems = await getResolvedSiteHeaderNavItems(session);

  const mobileLinks = navItems.map((it) => ({
    href: it.href,
    label: it.label,
    adminAccent: it.adminAccent,
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-broker-border bg-broker-bg backdrop-blur-none md:bg-broker-bg/90 md:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-broker-accent to-broker-accentDim text-broker-bg text-sm font-bold">
            GF
          </span>
          <span className="text-lg">
            GMR <span className="text-broker-accent">FX</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "rounded-md px-3 py-2 text-sm transition hover:bg-broker-surface",
                item.adminAccent
                  ? "font-medium text-broker-gold hover:text-broker-gold"
                  : "text-broker-muted hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <MobileSiteNav links={mobileLinks} />
          {session && <NotificationBell />}
          <HeaderAuth session={session} />
        </div>
      </div>
    </header>
  );
}
