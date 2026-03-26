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
    });
    setLoading(false);
    if (res?.error) {
      setErr("Email atau password salah.");
      return;
    }
    window.location.href = cb;
  }

  return (
    <div className="mt-8 space-y-6">
      {googleEnabled && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: cb })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-broker-border py-3 text-sm font-medium text-white hover:bg-broker-surface"
        >
          <span>Lanjut dengan Google</span>
        </button>
      )}
      {googleEnabled && (
        <div className="relative text-center text-xs text-broker-muted">
          <span className="bg-broker-bg px-2 relative z-10">atau email</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-broker-border" />
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-broker-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-surface px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-broker-border bg-broker-surface px-3 py-2 text-sm text-white"
          />
        </div>
        {err && <p className="text-sm text-broker-danger">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg disabled:opacity-50"
        >
          {loading ? "…" : "Login"}
        </button>
      </form>
      <p className="text-center text-sm text-broker-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-broker-accent hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}
