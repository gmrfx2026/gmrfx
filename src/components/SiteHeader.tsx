import Link from "next/link";
import { auth } from "@/auth";
import { HeaderAuth } from "./HeaderAuth";
import { MobileSiteNav } from "./MobileSiteNav";

const nav = [
  { href: "/", label: "Home" },
  { href: "/artikel", label: "Artikel" },
  { href: "/cari", label: "Cari" },
  { href: "/galeri", label: "Galeri" },
  { href: "/daftar", label: "Daftar" },
  { href: "/login", label: "Login" },
];

export async function SiteHeader() {
  const session = await auth();

  const mobileLinks: { href: string; label: string }[] = [];
  for (const item of nav) {
    if (item.href === "/daftar" && session) continue;
    if (item.href === "/login" && session) continue;
    mobileLinks.push(item);
  }
  if (session) {
    mobileLinks.push({ href: "/profil", label: "Profil" });
    if (session.user.role === "ADMIN") {
      mobileLinks.push({ href: "/admin", label: "Admin" });
    }
  }

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
          {nav.map((item) => {
            if (item.href === "/daftar" && session) return null;
            if (item.href === "/login" && session) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-broker-muted transition hover:bg-broker-surface hover:text-white"
              >
                {item.label}
              </Link>
            );
          })}
          {session && (
            <>
              <Link
                href="/profil"
                className="rounded-md px-3 py-2 text-sm text-broker-muted transition hover:bg-broker-surface hover:text-white"
              >
                Profil
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-2 text-sm font-medium text-broker-gold transition hover:bg-broker-surface"
                >
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <MobileSiteNav links={mobileLinks} />
          <HeaderAuth session={session} />
        </div>
      </div>
    </header>
  );
}
