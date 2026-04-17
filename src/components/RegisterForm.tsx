"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IndonesiaAddressFields } from "@/components/IndonesiaAddressFields";

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

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
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>("idle");
  const [phoneStatus, setPhoneStatus] = useState<AvailabilityStatus>("idle");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const passwordMismatch = confirmPassword.length > 0 && form.password !== confirmPassword;
  const passwordMatch = confirmPassword.length > 0 && form.password === confirmPassword;

  /** Debounced availability check untuk email. */
  useEffect(() => {
    const v = form.email.trim().toLowerCase();
    if (!v) {
      setEmailStatus("idle");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailStatus("invalid");
      return;
    }
    setEmailStatus("checking");
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/register/check-availability?email=${encodeURIComponent(v)}`, {
          signal: ctrl.signal,
        });
        const data = (await r.json().catch(() => ({}))) as {
          email?: { available: boolean };
          invalid?: { email?: boolean };
        };
        if (data.invalid?.email) setEmailStatus("invalid");
        else if (data.email) setEmailStatus(data.email.available ? "available" : "taken");
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") setEmailStatus("idle");
      }
    }, 500);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [form.email]);

  /** Debounced availability check untuk nomor WhatsApp. */
  useEffect(() => {
    const v = form.phoneWhatsApp.trim();
    if (!v) {
      setPhoneStatus("idle");
      return;
    }
    if (v.replace(/\D/g, "").length < 8) {
      setPhoneStatus("idle");
      return;
    }
    setPhoneStatus("checking");
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/register/check-availability?phone=${encodeURIComponent(v)}`, {
          signal: ctrl.signal,
        });
        const data = (await r.json().catch(() => ({}))) as {
          phone?: { available: boolean };
          invalid?: { phone?: boolean };
        };
        if (data.invalid?.phone) setPhoneStatus("invalid");
        else if (data.phone) setPhoneStatus(data.phone.available ? "available" : "taken");
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") setPhoneStatus("idle");
      }
    }, 500);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [form.phoneWhatsApp]);

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
        <div className="relative">
          <input
            className={`${input} pr-8 ${emailStatus === "taken" ? "border-red-500" : emailStatus === "available" ? "border-emerald-500" : ""}`}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
          {emailStatus === "available" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-400">✓</span>
          )}
          {emailStatus === "taken" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-400">✗</span>
          )}
          {emailStatus === "checking" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-broker-muted">...</span>
          )}
        </div>
        {emailStatus === "available" && (
          <p className="mt-1 text-[11px] text-emerald-400">Email tersedia</p>
        )}
        {emailStatus === "taken" && (
          <p className="mt-1 text-[11px] text-red-400">Email sudah terdaftar</p>
        )}
        {emailStatus === "checking" && (
          <p className="mt-1 text-[11px] text-broker-muted">Memeriksa…</p>
        )}
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
        <div className="relative">
          <input
            className={`${input} pr-8 ${phoneStatus === "taken" ? "border-red-500" : phoneStatus === "available" ? "border-emerald-500" : ""}`}
            value={form.phoneWhatsApp}
            onChange={(e) => set("phoneWhatsApp", e.target.value)}
            placeholder="0812xxxxxxxx atau +62812xxxxxxxx"
            required
          />
          {phoneStatus === "available" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-400">✓</span>
          )}
          {phoneStatus === "taken" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-400">✗</span>
          )}
          {phoneStatus === "checking" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-broker-muted">...</span>
          )}
        </div>
        {phoneStatus === "available" && (
          <p className="mt-1 text-[11px] text-emerald-400">Nomor tersedia</p>
        )}
        {phoneStatus === "taken" && (
          <p className="mt-1 text-[11px] text-red-400">Nomor WhatsApp sudah terdaftar</p>
        )}
        {phoneStatus === "invalid" && (
          <p className="mt-1 text-[11px] text-red-400">Format nomor tidak valid</p>
        )}
        {phoneStatus === "checking" && (
          <p className="mt-1 text-[11px] text-broker-muted">Memeriksa…</p>
        )}
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
        disabled={
          loading ||
          passwordMismatch ||
          emailStatus === "taken" ||
          emailStatus === "checking" ||
          phoneStatus === "taken" ||
          phoneStatus === "checking" ||
          phoneStatus === "invalid"
        }
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
