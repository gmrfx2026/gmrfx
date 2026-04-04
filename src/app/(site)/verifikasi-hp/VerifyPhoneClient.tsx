"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const RESEND_COOLDOWN = 60;

export function VerifyPhonePage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // mulai countdown saat halaman dimuat
  useEffect(() => {
    startCooldown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((v) => {
        if (v <= 1) { clearInterval(timerRef.current!); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setMsg("Parameter email tidak ditemukan. Kembali dan daftar ulang."); setMsgType("err"); return; }
    setMsg(""); setLoading(true);
    const res = await fetch("/api/register/verify-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMsg("Nomor WhatsApp terverifikasi! Mengarahkan ke halaman login…");
      setMsgType("ok");
      setTimeout(() => router.push("/login?registered=1"), 1500);
    } else {
      setMsg(data.error ?? "Verifikasi gagal");
      setMsgType("err");
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setMsg(""); setLoading(true);
    const res = await fetch("/api/register/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMsg("OTP baru telah dikirim ke WhatsApp Anda");
      setMsgType("ok");
      startCooldown();
    } else {
      setMsg(data.error ?? "Gagal kirim ulang OTP");
      setMsgType("err");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-5">
      <section className="rounded-2xl border border-broker-border/90 bg-broker-surface/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-2xl mb-4">
          💬
        </div>

        <h1 className="text-xl font-bold text-white">Verifikasi Nomor WhatsApp</h1>
        <p className="mt-2 text-sm text-broker-muted">
          Kode OTP 6 digit telah dikirim ke nomor WhatsApp yang Anda daftarkan.
          Masukkan kode tersebut untuk mengaktifkan akun.
        </p>

        {email && (
          <p className="mt-2 text-xs text-broker-muted/70">
            Mendaftar dengan: <span className="text-zinc-300">{email}</span>
          </p>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-broker-muted">Kode OTP</label>
            <input
              className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white focus:border-broker-accent/60 focus:outline-none"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="· · · · · ·"
            />
          </div>

          {msg && (
            <p className={`text-sm font-medium ${msgType === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {msgType === "ok" ? "✓ " : "✗ "}{msg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg disabled:opacity-40 hover:opacity-90 transition"
          >
            {loading ? "Memverifikasi…" : "Verifikasi Akun"}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="text-sm text-broker-accent disabled:text-broker-muted disabled:cursor-not-allowed hover:underline"
          >
            {cooldown > 0 ? `Kirim ulang OTP (${cooldown}s)` : "Kirim ulang OTP"}
          </button>
          <Link href="/daftar" className="text-xs text-broker-muted hover:text-broker-accent">
            ← Kembali ke halaman daftar
          </Link>
        </div>
      </section>
    </div>
  );
}
