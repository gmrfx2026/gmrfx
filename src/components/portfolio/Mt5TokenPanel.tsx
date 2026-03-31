"use client";

import { useCallback, useEffect, useState } from "react";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { useToast } from "@/components/ToastProvider";

type Row = {
  id: string;
  tokenHint: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  canCopy?: boolean;
};

function mt4IngestUrlFromMt5(mt5Url: string): string {
  return mt5Url.replace(/\/api\/mt5\/ingest\/?$/, "/api/mt4/ingest");
}

export function Mt5TokenPanel({ ingestPath }: { ingestPath: string }) {
  const { show } = useToast();
  const ingestPathMt4 = mt4IngestUrlFromMt5(ingestPath);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/profile/mt5-token", { credentials: "same-origin" });
      const j = (await r.json()) as { items?: Row[] };
      if (r.ok) setItems(j.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createToken() {
    setErr("");
    setNewToken(null);
    setBusy(true);
    try {
      const r = await fetch("/api/profile/mt5-token", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      const j = (await r.json()) as { token?: string; error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Gagal membuat token");
        return;
      }
      if (j.token) setNewToken(j.token);
      setLabel("");
      await load();
    } catch {
      setErr("Jaringan error");
    } finally {
      setBusy(false);
    }
  }

  async function copyPlainToClipboard(plain: string) {
    try {
      await navigator.clipboard.writeText(plain);
      show("Token disalin.");
    } catch {
      show("Gagal menyalin (izin clipboard?).", "err");
    }
  }

  async function copyTokenById(id: string) {
    setCopyingId(id);
    try {
      const r = await fetch("/api/profile/mt5-token/reveal", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = (await r.json()) as { token?: string; error?: string };
      if (!r.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal mengambil token.", "err");
        return;
      }
      if (j.token) await copyPlainToClipboard(j.token);
    } catch {
      show("Jaringan error.", "err");
    } finally {
      setCopyingId(null);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Cabut token ini? EA yang memakainya akan berhenti terhubung.")) return;
    setBusy(true);
    try {
      await fetch("/api/profile/mt5-token", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-broker-border/80 bg-broker-surface/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white sm:text-lg">Token EA (MetaTrader 4 &amp; MetaTrader 5)</h2>
      <div className="mt-3 rounded-xl border border-broker-accent/25 bg-broker-accent/5 px-4 py-3 text-sm leading-relaxed text-broker-muted">
        <p className="font-medium text-broker-accent">Cara situs mengenali member &amp; akun MetaTrader</p>
        <ul className="mt-2 list-inside list-disc space-y-1.5">
          <li>
            Token dibuat saat Anda <strong className="text-white">login sebagai member ini</strong> — server
            menyimpan token (hash) terikat ke <strong className="text-white">akun website Anda saja</strong>.
          </li>
          <li>
            EA wajib memakai <strong className="text-white">token Anda</strong>. Setiap kiriman ke API membawa
            header Bearer → log deal &amp; saldo masuk ke member tersebut.
          </li>
          <li>
            Nomor <strong className="text-white">login MetaTrader</strong> (mis. 12345678) ikut dikirim EA —
            dipakai membedakan beberapa akun MetaTrader milik member yang sama (demo vs live, dll.).
          </li>
          <li>
            Jangan bagikan token: siapa pun yang memakainya akan mengirim data ke <strong className="text-white">profil Anda</strong> di situs.
          </li>
        </ul>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-broker-muted">
        Tempel token di Expert Advisor dan izinkan URL di MetaTrader (
        <code className="rounded bg-broker-bg/50 px-1 text-xs text-broker-accent">mql5/README.md</code> /{" "}
        <code className="rounded bg-broker-bg/50 px-1 text-xs text-broker-accent">mql4/README.md</code>).
      </p>
      <p className="mt-2 text-sm text-broker-muted">
        Endpoint <span className="text-broker-muted/80">MetaTrader 5:</span>{" "}
        <code className="break-all rounded bg-broker-bg/50 px-1 text-xs">{ingestPath}</code>
      </p>
      <p className="mt-1 text-sm text-broker-muted">
        Endpoint <span className="text-broker-muted/80">MetaTrader 4:</span>{" "}
        <code className="break-all rounded bg-broker-bg/50 px-1 text-xs">{ingestPathMt4}</code>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="text-broker-muted">Nama / catatan (opsional)</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            placeholder="Contoh: Akun demo XM"
            className="mt-1 w-full rounded-xl border border-broker-border bg-broker-bg/30 px-3 py-2 text-sm text-white placeholder:text-broker-muted/50"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createToken()}
          className="shrink-0 rounded-xl bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
        >
          {busy ? "…" : "Buat token baru"}
        </button>
      </div>

      {err && <p className="mt-3 text-sm text-broker-danger">{err}</p>}

      {newToken && (
        <div className="mt-4 rounded-xl border border-broker-accent/40 bg-broker-accent/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-medium text-broker-accent">Simpan token — tampilan penuh hanya sekali</p>
            <button
              type="button"
              onClick={() => void copyPlainToClipboard(newToken)}
              className="shrink-0 rounded-lg bg-broker-accent px-3 py-1.5 text-xs font-semibold text-broker-bg hover:opacity-90"
            >
              Salin 1 klik
            </button>
          </div>
          <code className="mt-2 block break-all rounded-lg bg-broker-bg/60 p-3 text-xs text-white">{newToken}</code>
        </div>
      )}

      <div className="mt-6 border-t border-broker-border/50 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-broker-muted">Token aktif</p>
        {loading ? (
          <p className="mt-2 text-sm text-broker-muted">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="mt-2 text-sm text-broker-muted">Belum ada token.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {items.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-broker-border/60 bg-broker-bg/25 px-3 py-2 text-sm"
              >
                <span className="min-w-0 text-broker-muted">
                  <span className="font-mono text-white">{t.tokenHint}</span>
                  {t.label ? ` · ${t.label}` : ""}
                  <span className="mt-0.5 block text-xs text-broker-muted/70">
                    {t.lastUsedAt
                      ? `Terakhir dipakai: ${formatJakarta(t.lastUsedAt, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}`
                      : "Belum pernah dipakai"}
                  </span>
                </span>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy || copyingId === t.id || !t.canCopy}
                    title={
                      t.canCopy
                        ? "Salin token lengkap ke clipboard"
                        : "Token lama: cabut lalu buat baru untuk salin 1 klik"
                    }
                    onClick={() => void copyTokenById(t.id)}
                    className="rounded-lg border border-broker-accent/50 bg-broker-accent/15 px-3 py-1.5 text-xs font-semibold text-broker-accent hover:bg-broker-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {copyingId === t.id ? "…" : "Salin"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void revoke(t.id)}
                    className="text-xs font-medium text-broker-danger hover:underline disabled:opacity-50"
                  >
                    Cabut
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
