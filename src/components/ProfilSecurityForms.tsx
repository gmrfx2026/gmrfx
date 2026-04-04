"use client";

import { useState } from "react";

export function ProfilSecurityForms() {
  const [tab, setTab] = useState<"phone" | "password">("password");

  // Phone change state
  const [newPhone, setNewPhone] = useState("");
  const [codePhone, setCodePhone] = useState("");
  const [msgPhone, setMsgPhone] = useState("");
  const [msgPhoneType, setMsgPhoneType] = useState<"ok" | "err">("ok");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msgPw, setMsgPw] = useState("");
  const [msgPwType, setMsgPwType] = useState<"ok" | "err">("ok");
  const [loadingPw, setLoadingPw] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  async function reqOtp(purpose: "PHONE_UPDATE") {
    setMsgPhone("");
    const res = await fetch("/api/profile/otp-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose }),
    });
    const data = await res.json().catch(() => ({}));
    setMsgPhone(data.message ?? data.error ?? (res.ok ? "OTP dikirim ke nomor terdaftar" : "Gagal"));
    setMsgPhoneType(res.ok ? "ok" : "err");
  }

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setMsgPhone("");
    const res = await fetch("/api/profile/phone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPhone, code: codePhone }),
    });
    const data = await res.json().catch(() => ({}));
    setMsgPhone(data.error ?? (res.ok ? "Nomor WhatsApp berhasil diperbarui" : "Gagal"));
    setMsgPhoneType(res.ok ? "ok" : "err");
    if (res.ok) { setNewPhone(""); setCodePhone(""); }
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsgPw("Konfirmasi password baru tidak cocok");
      setMsgPwType("err");
      return;
    }
    setMsgPw("");
    setLoadingPw(true);
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoadingPw(false);
    if (res.ok) {
      setMsgPw("Password berhasil diperbarui");
      setMsgPwType("ok");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMsgPw(data.error ?? "Gagal memperbarui password");
      setMsgPwType("err");
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white focus:border-broker-accent/60 focus:outline-none";

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {show ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      )}
    </svg>
  );

  return (
    <section className="mt-10 border-t border-broker-border pt-10">
      <h2 className="text-lg font-semibold text-white">Keamanan Akun</h2>
      <p className="mt-1 text-xs text-broker-muted">
        Kelola password dan nomor WhatsApp yang terdaftar di akun Anda.
      </p>

      {/* Tab selector */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            tab === "password"
              ? "bg-broker-accent text-broker-bg"
              : "bg-broker-surface text-broker-muted hover:text-white"
          }`}
        >
          Ganti password
        </button>
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            tab === "phone"
              ? "bg-broker-accent text-broker-bg"
              : "bg-broker-surface text-broker-muted hover:text-white"
          }`}
        >
          Ganti nomor WhatsApp
        </button>
      </div>

      {/* ── Ganti password ── */}
      {tab === "password" && (
        <form onSubmit={savePw} className="mt-5 max-w-md space-y-4">
          {/* Password saat ini */}
          <div>
            <label className="text-xs font-medium text-broker-muted">Password saat ini</label>
            <div className="relative">
              <input
                className={input + " pr-10"}
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Masukkan password yang aktif"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-broker-muted hover:text-white"
              >
                <EyeIcon show={showCurrent} />
              </button>
            </div>
          </div>

          <div className="border-t border-broker-border/50" />

          {/* Password baru */}
          <div>
            <label className="text-xs font-medium text-broker-muted">Password baru</label>
            <div className="relative">
              <input
                className={input + " pr-10"}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-broker-muted hover:text-white"
              >
                <EyeIcon show={showNew} />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-broker-muted/60">Minimal 8 karakter</p>
          </div>

          {/* Konfirmasi password baru */}
          <div>
            <label className="text-xs font-medium text-broker-muted">Ulangi password baru</label>
            <div className="relative">
              <input
                className={`${input} pr-10 ${
                  passwordMismatch
                    ? "border-red-500"
                    : passwordMatch
                    ? "border-emerald-500"
                    : ""
                }`}
                type={showNew ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Ketik ulang password baru"
              />
              {passwordMatch && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>
              )}
              {passwordMismatch && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">✗</span>
              )}
            </div>
            {passwordMismatch && (
              <p className="mt-1 text-[11px] text-red-400">Password tidak cocok</p>
            )}
            {passwordMatch && (
              <p className="mt-1 text-[11px] text-emerald-400">Password cocok</p>
            )}
          </div>

          {msgPw && (
            <p className={`text-sm font-medium ${msgPwType === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {msgPwType === "ok" ? "✓ " : "✗ "}{msgPw}
            </p>
          )}

          <button
            type="submit"
            disabled={loadingPw || passwordMismatch || !currentPassword || !newPassword || !confirmPassword}
            className="w-full rounded-lg bg-broker-accent py-2.5 text-sm font-semibold text-broker-bg disabled:opacity-40 hover:opacity-90 transition"
          >
            {loadingPw ? "Menyimpan…" : "Perbarui Password"}
          </button>
        </form>
      )}

      {/* ── Ganti nomor WhatsApp ── */}
      {tab === "phone" && (
        <form onSubmit={savePhone} className="mt-5 max-w-md space-y-4">
          <p className="text-xs text-broker-muted">
            OTP akan dikirim ke nomor WhatsApp yang <strong className="text-zinc-300">saat ini terdaftar</strong> untuk verifikasi.
          </p>
          <button
            type="button"
            onClick={() => reqOtp("PHONE_UPDATE")}
            className="rounded-lg border border-broker-accent/40 bg-broker-accent/10 px-4 py-2 text-xs text-broker-accent hover:bg-broker-accent/20 transition"
          >
            Kirim OTP ke nomor terdaftar
          </button>
          <div>
            <label className="text-xs font-medium text-broker-muted">Nomor WhatsApp baru</label>
            <input
              className={input}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-broker-muted">Kode OTP</label>
            <input
              className={input}
              value={codePhone}
              onChange={(e) => setCodePhone(e.target.value)}
              required
              maxLength={6}
              placeholder="6 digit kode OTP"
            />
          </div>

          {msgPhone && (
            <p className={`text-sm font-medium ${msgPhoneType === "ok" ? "text-emerald-400" : "text-red-400"}`}>
              {msgPhoneType === "ok" ? "✓ " : "✗ "}{msgPhone}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-broker-accent py-2.5 text-sm font-semibold text-broker-bg hover:opacity-90 transition"
          >
            Simpan Nomor WhatsApp
          </button>
        </form>
      )}
    </section>
  );
}
