"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "reset" | "done";

export function ForgotPasswordClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [loading, setLoading] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    // Selalu tampilkan pesan sukses (security: tidak bocorkan apakah email terdaftar)
    setMsg("Jika email terdaftar, OTP akan dikirim ke nomor WhatsApp yang terhubung.");
    setMsgType("ok");
    setStep("reset");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg("Konfirmasi password tidak cocok"); setMsgType("err"); return;
    }
    setMsg(""); setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setStep("done");
    } else {
      setMsg(data.error ?? "Gagal mereset password");
      setMsgType("err");
    }
  }

  const input = "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white focus:border-broker-accent/60 focus:outline-none";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-5">
      <section className="rounded-2xl border border-broker-border/90 bg-broker-surface/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-2xl mb-4">
          🔑
        </div>

        {step === "email" && (
          <>
            <h1 className="text-xl font-bold text-white">Lupa Password</h1>
            <p className="mt-2 text-sm text-broker-muted">
              Masukkan email akun Anda. OTP akan dikirim ke nomor WhatsApp yang terdaftar.
            </p>
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-broker-muted">Email</label>
                <input
                  className={input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@anda.com"
                />
              </div>
              {msg && (
                <p className={`text-sm ${msgType === "ok" ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg disabled:opacity-40 hover:opacity-90 transition"
              >
                {loading ? "Mengirim…" : "Kirim OTP ke WhatsApp"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 className="text-xl font-bold text-white">Reset Password</h1>
            <p className="mt-2 text-sm text-broker-muted">
              Masukkan kode OTP yang dikirim ke WhatsApp, lalu buat password baru.
            </p>
            {msg && (
              <p className={`mt-3 text-xs rounded-lg border px-3 py-2 ${
                msgType === "ok"
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                  : "border-red-500/30 bg-red-950/20 text-red-400"
              }`}>{msg}</p>
            )}
            <form onSubmit={handleReset} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-broker-muted">Kode OTP</label>
                <input
                  className="mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-3 text-center text-xl font-bold tracking-[0.5em] text-white focus:border-broker-accent/60 focus:outline-none"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  placeholder="· · · · · ·"
                />
              </div>
              <div className="border-t border-broker-border/50" />
              <div>
                <label className="text-xs font-medium text-broker-muted">Password baru</label>
                <div className="relative">
                  <input
                    className={input + " pr-10"}
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-broker-muted text-xs">
                    {showPw ? "semb." : "lihat"}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-broker-muted">Ulangi password baru</label>
                <input
                  className={`${input} ${passwordMismatch ? "border-red-500" : passwordMatch ? "border-emerald-500" : ""}`}
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ketik ulang password baru"
                />
                {passwordMismatch && <p className="mt-1 text-[11px] text-red-400">Password tidak cocok</p>}
                {passwordMatch && <p className="mt-1 text-[11px] text-emerald-400">Password cocok ✓</p>}
              </div>
              <button
                type="submit"
                disabled={loading || passwordMismatch || !code || !newPassword || !confirmPassword}
                className="w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg disabled:opacity-40 hover:opacity-90 transition"
              >
                {loading ? "Menyimpan…" : "Reset Password"}
              </button>
              <button type="button" onClick={() => { setStep("email"); setMsg(""); }}
                className="w-full text-xs text-broker-muted hover:text-broker-accent">
                ← Gunakan email lain
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h1 className="text-xl font-bold text-white">Password Berhasil Direset</h1>
            <p className="mt-2 text-sm text-broker-muted">Silakan login dengan password baru Anda.</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg hover:opacity-90 transition"
            >
              Ke halaman Login
            </button>
          </div>
        )}

        {step !== "done" && (
          <p className="mt-5 text-center text-sm text-broker-muted">
            Ingat password?{" "}
            <Link href="/login" className="text-broker-accent hover:underline">Login</Link>
          </p>
        )}
      </section>
    </div>
  );
}
