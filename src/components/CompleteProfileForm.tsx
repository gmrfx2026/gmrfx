"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function CompleteProfileForm() {
  const { update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    name: "",
    phoneWhatsApp: "",
    addressLine: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kodePos: "",
    negara: "Indonesia",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/profile/complete-oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Gagal menyimpan");
      return;
    }
    await update();
    router.push("/profil");
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-surface px-3 py-2 text-sm text-white";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-xs text-broker-muted">Nama tampilan</label>
        <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} required />
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
      <p className="text-xs font-medium text-broker-accent">Alamat</p>
      <div>
        <label className="text-xs text-broker-muted">Jalan / desa</label>
        <input
          className={input}
          value={form.addressLine}
          onChange={(e) => set("addressLine", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-broker-muted">Kecamatan</label>
          <input
            className={input}
            value={form.kecamatan}
            onChange={(e) => set("kecamatan", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Kabupaten / kota</label>
          <input
            className={input}
            value={form.kabupaten}
            onChange={(e) => set("kabupaten", e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-broker-muted">Provinsi</label>
          <input
            className={input}
            value={form.provinsi}
            onChange={(e) => set("provinsi", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Kode pos</label>
          <input
            className={input}
            value={form.kodePos}
            onChange={(e) => set("kodePos", e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-broker-muted">Negara</label>
        <input className={input} value={form.negara} onChange={(e) => set("negara", e.target.value)} required />
      </div>
      {err && <p className="text-sm text-broker-danger">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-broker-accent py-3 text-sm font-semibold text-broker-bg disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan & lanjut"}
      </button>
    </form>
  );
}
