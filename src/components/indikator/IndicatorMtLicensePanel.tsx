"use client";

import Link from "next/link";
import { useState } from "react";

type LicenseProps = {
  licenseId: string;
  productCode: string;
  hint: string;
  expiresAtIso: string;
  active: boolean;
  accountEmail: string;
};

export function IndicatorMtLicensePanel({ license }: { license: LicenseProps }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/member/indicator-licenses/${license.licenseId}/reveal`, {
        method: "POST",
      });
      const data = (await r.json()) as { licenseKey?: string; error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal");
        return;
      }
      if (typeof data.licenseKey === "string") setRevealed(data.licenseKey);
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-5">
      <h2 className="text-lg font-semibold text-white">Lisensi MT — {license.productCode}</h2>
      <p className="mt-2 text-sm text-broker-muted">
        Pasang indikator di MetaTrader, lalu isi{" "}
        <strong className="text-white/90">email akun ini</strong> dan{" "}
        <strong className="text-white/90">license key</strong> (tombol di bawah). Email harus sama persis dengan yang
        terdaftar di GMR FX:
      </p>
      <p className="mt-2 font-mono text-sm text-emerald-300">{license.accountEmail}</p>
      <p className="mt-3 text-xs text-broker-muted">
        Berlaku hingga{" "}
        <span className={license.active ? "text-emerald-400/90" : "text-amber-400/90"}>
          {new Date(license.expiresAtIso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
        </span>
        {!license.active ? <span className="ml-2 text-amber-400">— lisensi tidak aktif</span> : null}
      </p>
      <p className="mt-2 text-xs text-broker-muted">Cuplikan key: {license.hint}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!license.active || loading}
          onClick={() => void reveal()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Memuat…" : "Tampilkan license key"}
        </button>
        <Link
          href="/profil?tab=indikator"
          className="inline-flex items-center rounded-lg border border-broker-border px-4 py-2 text-sm text-white hover:bg-broker-bg/50"
        >
          Kelola di profil
        </Link>
      </div>
      {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
      {revealed ? (
        <div className="mt-3">
          <p className="text-xs text-broker-muted">Salin key berikut ke parameter indikator:</p>
          <p className="mt-1 break-all rounded-lg bg-broker-bg/80 p-3 font-mono text-xs text-emerald-300">{revealed}</p>
        </div>
      ) : null}
      <p className="mt-4 text-[11px] leading-relaxed text-broker-muted/80">
        Endpoint verifikasi (HTTPS):{" "}
        <code className="text-broker-gold/80">/api/mt/license/verify</code> — body JSON{" "}
        <code className="text-broker-gold/80">{`{ "productCode", "email", "licenseKey" }`}</code>. Respons{" "}
        <code className="text-broker-gold/80">ok: true</code> berisi <code className="text-broker-gold/80">validUntil</code>.
      </p>
    </div>
  );
}
