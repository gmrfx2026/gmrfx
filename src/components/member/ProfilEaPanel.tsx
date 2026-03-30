"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { useCallback, useEffect, useState } from "react";

const MarketplaceRichDescription = dynamic(
  () =>
    import("@/components/member/MarketplaceRichDescription").then((m) => m.MarketplaceRichDescription),
  { ssr: false, loading: () => <p className="py-4 text-sm text-broker-muted">Memuat editor…</p> }
);

type Row = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  priceIdr: number;
  fileName: string;
  platform: string;
  published: boolean;
  purchaseCount: number;
};

const emptyForm = {
  title: "",
  description: "",
  priceIdr: "0",
  platform: "mt5",
  published: false,
};

export function ProfilEaPanel() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [descEditorKey, setDescEditorKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/member/eas");
      const data = (await r.json()) as { items?: Row[]; error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal memuat daftar");
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setErr("Gagal memuat daftar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    setEditId(null);
    setForm(emptyForm);
    setFile(null);
    setMsg(null);
    setErr(null);
    setDescEditorKey((k) => k + 1);
  }

  function startEdit(row: Row) {
    setEditId(row.id);
    setForm({
      title: row.title,
      description: row.description?.trim() ? row.description : "<p></p>",
      priceIdr: String(row.priceIdr),
      platform: row.platform,
      published: row.published,
    });
    setFile(null);
    setMsg(null);
    setErr(null);
    setDescEditorKey((k) => k + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setMsg(null);

    const fd = new FormData();
    fd.set("title", form.title.trim());
    fd.set("description", form.description);
    fd.set("priceIdr", form.priceIdr.trim() || "0");
    fd.set("platform", form.platform);
    fd.set("published", form.published ? "true" : "false");
    if (file) fd.set("file", file);
    else if (!editId) {
      setErr("File wajib untuk EA baru");
      setSaving(false);
      return;
    }

    try {
      const url = editId ? `/api/member/eas/${editId}` : "/api/member/eas";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", body: fd });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal menyimpan");
        return;
      }
      setMsg(editId ? "EA diperbarui." : "EA ditambahkan.");
      startCreate();
      await load();
    } catch {
      setErr("Jaringan error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Expert Advisor (EA)</h2>
        <p className="mt-1 text-sm text-broker-muted">
          Robot / EA untuk MT4 atau MT5. Aturan sama seperti indikator: harga 0 = gratis; berbayar memotong
          wallet pembeli dan mengkredit Anda. Deskripsi memakai editor seperti artikel (format teks, list,
          gambar).
        </p>
        <p className="mt-2 text-sm text-broker-muted">
          Katalog:{" "}
          <Link href="/ea" className="font-medium text-broker-accent hover:underline">
            /ea
          </Link>
        </p>
      </div>

      <form
        onSubmit={(e) => void submit(e)}
        className="rounded-xl border border-broker-border bg-broker-surface/40 p-4 space-y-4"
      >
        <p className="text-sm font-semibold text-white">{editId ? "Edit EA" : "Tambah EA baru"}</p>
        {editId && (
          <button
            type="button"
            onClick={startCreate}
            className="text-xs text-broker-accent hover:underline"
          >
            Batal edit — form baru
          </button>
        )}

        <label className="block space-y-1">
          <span className="text-xs text-broker-muted">Judul</span>
          <input
            required
            minLength={3}
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
          />
        </label>

        <div className="space-y-1">
          <span className="text-xs text-broker-muted">Deskripsi (opsional)</span>
          <div key={descEditorKey} className="min-h-[12rem]">
            <MarketplaceRichDescription
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              placeholder="Jelaskan EA, setfile, risiko, saran VPS…"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-broker-muted">Harga (IDR, 0 = gratis)</span>
            <input
              type="number"
              min={0}
              step="1"
              value={form.priceIdr}
              onChange={(e) => setForm((f) => ({ ...f, priceIdr: e.target.value }))}
              className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-broker-muted">Platform</span>
            <select
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
            >
              <option value="mt5">MetaTrader 5</option>
              <option value="mt4">MetaTrader 4</option>
              <option value="tradingview">TradingView</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-broker-muted">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="rounded border-broker-border"
          />
          Tampilkan di katalog publik
        </label>

        <label className="block space-y-1">
          <span className="text-xs text-broker-muted">
            File {editId ? "(kosongkan jika tidak diganti)" : "(wajib)"}
          </span>
          <input
            type="file"
            required={!editId}
            accept=".zip,.ex4,.ex5,.mq4,.mq5"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-broker-muted file:mr-3 file:rounded file:border-0 file:bg-broker-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-broker-bg"
          />
        </label>

        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        {err && <p className="text-sm text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : editId ? "Simpan perubahan" : "Publikasikan / simpan"}
        </button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-white">EA Anda</h3>
        {loading ? (
          <p className="mt-3 text-sm text-broker-muted">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-broker-muted">Belum ada EA.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex flex-col gap-2 rounded-xl border border-broker-border/80 bg-broker-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{it.title}</p>
                  <p className="text-xs text-broker-muted">
                    {it.published ? "Publik" : "Draft"} · {formatMarketplacePlatformLabel(it.platform)} ·{" "}
                    {it.priceIdr <= 0 ? "Gratis" : `Rp ${it.priceIdr.toLocaleString("id-ID")}`} ·{" "}
                    {it.purchaseCount} pembelian
                  </p>
                  <Link
                    href={`/ea/${it.slug}`}
                    className="mt-1 inline-block text-xs text-broker-accent hover:underline"
                  >
                    Lihat halaman publik
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(it)}
                  className="shrink-0 rounded-lg border border-broker-border px-3 py-1.5 text-sm text-white hover:bg-broker-bg/50"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
