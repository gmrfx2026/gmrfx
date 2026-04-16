"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  productCode: string;
  hint: string;
  expiresAt: string;
  createdAt: string;
  emailRegistered: string;
  indicatorTitle: string;
  indicatorSlug: string;
  active: boolean;
};

export function ProfilMyMtIndicatorLicenses() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealErr, setRevealErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/member/indicator-licenses");
      const data = (await r.json()) as { items?: Item[]; error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal memuat");
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setErr("Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reveal(id: string) {
    setRevealId(id);
    setRevealedKey(null);
    setRevealErr(null);
    try {
      const r = await fetch(`/api/member/indicator-licenses/${id}/reveal`, { method: "POST" });
      const data = (await r.json()) as { licenseKey?: string; error?: string };
      if (!r.ok) {
        setRevealErr(typeof data.error === "string" ? data.error : "Gagal menampilkan key");
        return;
      }
      if (typeof data.licenseKey === "string") {
        setRevealedKey(data.licenseKey);
      }
    } catch {
      setRevealErr("Jaringan error");
    }
  }

  if (loading) {
    return <p className="text-sm text-broker-muted">Memuat lisensi MT…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 rounded-xl border border-broker-accent/20 bg-broker-accent/5 p-5">
      <h3 className="text-lg font-semibold text-white">Lisensi indikator MT (pembelian Anda)</h3>
      <p className="mt-1 text-xs text-broker-muted">
        Key dipakai di MetaTrader bersama email akun GMR FX Anda. Verifikasi online:{" "}
        <code className="rounded bg-broker-bg/60 px-1 text-[11px] text-emerald-300">POST /api/mt/license/verify</code>
      </p>
      <ul className="mt-4 space-y-4">
        {items.map((it) => (
          <li
            key={it.id}
            className="rounded-lg border border-broker-border/80 bg-broker-surface/40 p-4 text-sm"
          >
            <p className="font-medium text-white">{it.indicatorTitle}</p>
            <p className="mt-1 text-xs text-broker-muted">
              Produk: <span className="font-mono text-broker-gold/90">{it.productCode}</span>
              {" · "}
              <Link href={`/indikator/${it.indicatorSlug}`} className="text-broker-accent hover:underline">
                Halaman indikator
              </Link>
            </p>
            <p className="mt-1 text-xs text-broker-muted">
              Email terdaftar: <span className="text-white/90">{it.emailRegistered}</span>
            </p>
            <p className="mt-1 text-xs text-broker-muted">
              Berlaku s/d:{" "}
              <span className={it.active ? "text-emerald-400/90" : "text-amber-400/90"}>
                {new Date(it.expiresAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {!it.active ? <span className="ml-2 text-amber-400/90">(tidak aktif)</span> : null}
            </p>
            <p className="mt-1 font-mono text-xs text-broker-muted">Key {it.hint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!it.active}
                onClick={() => void reveal(it.id)}
                className="rounded-lg border border-broker-border px-3 py-1.5 text-xs font-medium text-white hover:bg-broker-bg/50 disabled:opacity-40"
              >
                Tampilkan key lengkap
              </button>
            </div>
            {revealId === it.id && revealErr ? (
              <p className="mt-2 text-xs text-red-400">{revealErr}</p>
            ) : null}
            {revealId === it.id && revealedKey ? (
              <p className="mt-2 break-all rounded bg-broker-bg/80 p-2 font-mono text-xs text-emerald-300">
                {revealedKey}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
