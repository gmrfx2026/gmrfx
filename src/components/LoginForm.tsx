"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export function LoginForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const cb = callbackUrl?.startsWith("/") ? callbackUrl : "/profil";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: cb,
    });
    setLoading(false);
    if (!res?.ok) {
      setErr(res?.error ? "Email atau password salah." : "Gagal masuk. Coba lagi.");
      return;
    }
    // URL dari server (redirect callback); pakai href penuh asal origin sama — hindari path saja yang bisa salah di edge case.
    const raw = res.url ?? cb;
    try {
      const resolved = new URL(raw, window.location.origin);
      const fallback = new URL(cb, window.location.origin).href;
      window.location.assign(resolved.origin === window.location.origin ? resolved.href : fallback);
    } catch {
      window.location.assign(cb);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      {googleEnabled && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: cb })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-broker-border bg-broker-bg/20 py-3 text-sm font-medium text-white transition hover:border-broker-accent/30 hover:bg-broker-surface/60"
        >
          <span>Lanjut dengan Google</span>
        </button>
      )}
      {googleEnabled && (
        <div className="relative py-1 text-center text-xs text-broker-muted">
          <span className="relative z-10 bg-broker-surface px-3 py-0.5">atau email</span>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-broker-border/80" />
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-xs font-medium text-broker-muted">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-broker-border bg-broker-bg/30 px-3 py-2.5 text-sm text-white placeholder:text-broker-muted/50 outline-none ring-broker-accent/40 transition focus:border-broker-accent/50 focus:ring-2"
            placeholder="nama@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-medium text-broker-muted">
              Password
            </label>
            <Link href="/lupa-password" className="text-xs text-broker-accent hover:underline">
              Lupa password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-broker-border bg-broker-bg/30 px-3 py-2.5 text-sm text-white outline-none ring-broker-accent/40 transition focus:border-broker-accent/50 focus:ring-2"
          />
        </div>
        {err && <p className="text-sm text-broker-danger">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-broker-accent py-3 text-sm font-semibold text-broker-bg transition hover:bg-broker-accentDim disabled:opacity-50"
        >
          {loading ? "…" : "Login"}
        </button>
      </form>
      <p className="border-t border-broker-border/50 pt-5 text-center text-sm text-broker-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-broker-accent hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}
