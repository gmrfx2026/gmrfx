"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IndonesiaAddressFields } from "@/components/IndonesiaAddressFields";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneWhatsApp: "",
    addressLine: "",
    districtCode: "",
    kodePos: "",
    negara: "Indonesia",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const passwordMismatch = confirmPassword.length > 0 && form.password !== confirmPassword;
  const passwordMatch = confirmPassword.length > 0 && form.password === confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (form.password !== confirmPassword) {
      setErr("Konfirmasi password tidak cocok. Periksa kembali password Anda.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      const parts: string[] = [data.error ?? "Gagal mendaftar"];
      if (data.prismaCode) parts.push(`[${data.prismaCode}]`);
      if (data.hint) parts.push(String(data.hint));
      setErr(parts.join(" "));
      return;
    }
    if (data.pending) {
      router.push(`/verifikasi-hp?email=${encodeURIComponent(form.email)}`);
    } else {
      // Verifikasi HP nonaktif — akun langsung aktif, arahkan ke login
      router.push(`/login?registered=1`);
    }
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-surface px-3 py-2 text-sm text-white";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label className="text-xs text-broker-muted">Nama</label>
        <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div>
        <label className="text-xs text-broker-muted">Email</label>
        <input
          className={input}
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs text-broker-muted">Password</label>
        <input
          className={input}
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          required
          minLength={8}
          placeholder="Minimal 8 karakter"
        />
        <p className="mt-1 text-[11px] text-broker-muted/70">Minimal 8 karakter</p>
      </div>
      <div>
        <label className="text-xs text-broker-muted">Konfirmasi Password</label>
        <div className="relative">
          <input
            className={`${input} ${passwordMismatch ? "border-red-500 pr-8" : passwordMatch ? "border-emerald-500 pr-8" : ""}`}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Ulangi password di atas"
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
      <div>
        <label className="text-xs text-broker-muted">Nomor WhatsApp</label>
        <input
          className={input}
          value={form.phoneWhatsApp}
          onChange={(e) => set("phoneWhatsApp", e.target.value)}
          required
        />
      </div>
      <IndonesiaAddressFields
        districtCode={form.districtCode}
        onDistrictCodeChange={(v) => set("districtCode", v)}
        addressLine={form.addressLine}
        onAddressLineChange={(v) => set("addressLine", v)}
        kodePos={form.kodePos}
        onKodePosChange={(v) => set("kodePos", v)}
        negara={form.negara}
        onNegaraChange={(v) => set("negara", v)}
        inputClass={input}
      />
      {err && <p className="text-sm text-broker-danger">{err}</p>}
      <button
        type="submit"
        disabled={loading || passwordMismatch}
        className="w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Daftar"}
      </button>
      <p className="text-center text-sm text-broker-muted">
        Sudah terdaftar?{" "}
        <Link href="/login" className="text-broker-accent hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
