"use client";

import { useState } from "react";

export function ProfilSecurityForms() {
  const [tab, setTab] = useState<"phone" | "password">("phone");
  const [newPhone, setNewPhone] = useState("");
  const [codePhone, setCodePhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codePw, setCodePw] = useState("");
  const [msg, setMsg] = useState("");

  async function reqOtp(purpose: "PHONE_UPDATE" | "PASSWORD_CHANGE") {
    setMsg("");
    const res = await fetch("/api/profile/otp-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(data.message ?? data.error ?? (res.ok ? "OTP diminta" : "Gagal"));
  }

  async function savePhone(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/profile/phone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPhone, code: codePhone }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(data.error ?? (res.ok ? "Nomor diperbarui" : "Gagal"));
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword, code: codePw }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(data.error ?? (res.ok ? "Password diperbarui" : "Gagal"));
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white";

  return (
    <section className="mt-10 border-t border-broker-border pt-10">
      <h2 className="text-lg font-semibold text-white">Keamanan (OTP SMS — stub dev)</h2>
      <p className="mt-1 text-xs text-broker-muted">
        Di development, OTP tercetak di terminal server atau pakai <code className="text-broker-gold">DEV_OTP_CODE</code>{" "}
        di .env. Hubungkan gateway SMS untuk production.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("phone")}
          className={`rounded-lg px-3 py-1.5 text-xs ${tab === "phone" ? "bg-broker-accent text-broker-bg" : "bg-broker-surface text-broker-muted"}`}
        >
          Ganti nomor HP
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`rounded-lg px-3 py-1.5 text-xs ${tab === "password" ? "bg-broker-accent text-broker-bg" : "bg-broker-surface text-broker-muted"}`}
        >
          Ganti password
        </button>
      </div>

      {tab === "phone" && (
        <form onSubmit={savePhone} className="mt-4 max-w-md space-y-3">
          <button
            type="button"
            onClick={() => reqOtp("PHONE_UPDATE")}
            className="text-xs text-broker-accent hover:underline"
          >
            Minta OTP ke nomor terdaftar
          </button>
          <div>
            <label className="text-xs text-broker-muted">Nomor baru (WhatsApp)</label>
            <input className={input} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-broker-muted">Kode OTP</label>
            <input className={input} value={codePhone} onChange={(e) => setCodePhone(e.target.value)} required />
          </div>
          <button type="submit" className="rounded-lg border border-broker-border px-4 py-2 text-sm text-white">
            Simpan nomor
          </button>
        </form>
      )}

      {tab === "password" && (
        <form onSubmit={savePw} className="mt-4 max-w-md space-y-3">
          <button
            type="button"
            onClick={() => reqOtp("PASSWORD_CHANGE")}
            className="text-xs text-broker-accent hover:underline"
          >
            Minta OTP ke nomor terdaftar
          </button>
          <div>
            <label className="text-xs text-broker-muted">Password baru</label>
            <input
              className={input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-xs text-broker-muted">Kode OTP</label>
            <input className={input} value={codePw} onChange={(e) => setCodePw(e.target.value)} required />
          </div>
          <button type="submit" className="rounded-lg border border-broker-border px-4 py-2 text-sm text-white">
            Simpan password
          </button>
        </form>
      )}

      {msg && <p className="mt-4 text-sm text-broker-muted">{msg}</p>}
    </section>
  );
}
