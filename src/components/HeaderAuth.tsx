"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export function HeaderAuth({ session }: { session: Session | null }) {
  if (!session?.user) {
    return (
      <div className="flex md:hidden gap-1">
        <Link
          href="/login"
          className="rounded-md px-2 py-1.5 text-xs text-broker-muted hover:text-white"
        >
          Login
        </Link>
        <Link
          href="/daftar"
          className="rounded-md bg-broker-accent/15 px-2 py-1.5 text-xs text-broker-accent"
        >
          Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[140px] truncate text-xs text-broker-muted sm:inline">
        {session.user.name ?? session.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-md border border-broker-border px-3 py-1.5 text-xs text-broker-muted transition hover:border-broker-accent hover:text-broker-accent"
      >
        Keluar
      </button>
    </div>
  );
}
