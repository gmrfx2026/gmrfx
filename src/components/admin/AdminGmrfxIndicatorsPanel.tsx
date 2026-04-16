"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { formatMarketplacePlatformLabel } from "@/lib/marketplacePlatform";
import { useCallback, useEffect, useState } from "react";

const MarketplaceRichDescription = dynamic(
  () =>
    import("@/components/member/MarketplaceRichDescription").then((m) => m.MarketplaceRichDescription),
  { ssr: false, loading: () => <p className="py-4 text-sm text-gray-500">Memuat editor…</p> }
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
  mtLicenseProductCode: string | null;
  mtLicenseValidityDays: number | null;
};

const emptyForm = {
  title: "",
  description: "<p></p>",
  priceIdr: "0",
  platform: "mt5",
  published: false,
  mtLicenseProductCode: "",
  mtLicenseValidityDays: "365",
};

export function AdminGmrfxIndicatorsPanel({
  sellerConfigured,
}: {
  sellerConfigured: boolean;
}) {
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
      const r = await fetch("/api/admin/gmrfx-indicators");
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
      mtLicenseProductCode: row.mtLicenseProductCode ?? "",
      mtLicenseValidityDays:
        row.mtLicenseValidityDays != null ? String(row.mtLicenseValidityDays) : "365",
    });
    setFile(null);
    setMsg(null);
    setErr(null);
    setDescEditorKey((k) => k + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerConfigured) return;
    setSaving(true);
    setErr(null);
    setMsg(null);

    const fd = new FormData();
    fd.set("title", form.title.trim());
    fd.set("description", form.description);
    fd.set("priceIdr", form.priceIdr.trim() || "0");
    fd.set("platform", form.platform);
    fd.set("published", form.published ? "true" : "false");
    fd.set("mtLicenseProductCode", form.mtLicenseProductCode.trim());
    fd.set("mtLicenseValidityDays", form.mtLicenseValidityDays.trim() || "365");
    if (file) fd.set("file", file);
    else if (!editId) {
      setErr("File wajib untuk indikator baru");
      setSaving(false);
      return;
    }

    try {
      const url = editId ? `/api/admin/gmrfx-indicators/${editId}` : "/api/admin/gmrfx-indicators";
      const r = await fetch(url, { method: editId ? "PATCH" : "POST", body: fd });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal menyimpan");
        return;
      }
      setMsg(editId ? "Indikator GMRFX diperbarui." : "Indikator GMRFX ditambahkan.");
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
      {!sellerConfigured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Akun penjual resmi belum dikonfigurasi</p>
          <p className="mt-1 text-amber-900/90">
            Isi bagian <strong>Akun penjual resmi GMRFX</strong> di atas (simpan ke database), atau set env{" "}
            <code className="rounded bg-white/80 px-1">GMRFX_OFFICIAL_SELLER_USER_ID</code>. User penjual perlu alamat
            wallet jika menjual berbayar.
          </p>
        </div>
      ) : null}

      <form
        onSubmit={(e) => void submit(e)}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-gray-900">{editId ? "Edit indikator GMRFX" : "Tambah indikator GMRFX"}</p>
        {editId && (
          <button type="button" onClick={startCreate} className="text-xs text-blue-600 hover:underline">
            Batal edit — form baru
          </button>
        )}

        <label className="block space-y-1">
          <span className="text-xs font-medium text-gray-500">Judul</span>
          <input
            required
            minLength={3}
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            disabled={!sellerConfigured}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
          />
        </label>

        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500">Deskripsi</span>
          <div key={descEditorKey} className="min-h-[12rem]">
            <MarketplaceRichDescription
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              placeholder="Instalasi, parameter, lisensi…"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-500">Harga (IDR)</span>
            <input
              type="number"
              min={0}
              step="1"
              value={form.priceIdr}
              onChange={(e) => setForm((f) => ({ ...f, priceIdr: e.target.value }))}
              disabled={!sellerConfigured}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-500">Platform</span>
            <select
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              disabled={!sellerConfigured}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
            >
              <option value="mt5">MetaTrader 5</option>
              <option value="mt4">MetaTrader 4</option>
              <option value="tradingview">TradingView</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-500">Kode lisensi MT</span>
            <input
              maxLength={64}
              value={form.mtLicenseProductCode}
              onChange={(e) => setForm((f) => ({ ...f, mtLicenseProductCode: e.target.value }))}
              placeholder="GMRFX_ZZ"
              disabled={!sellerConfigured}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900 disabled:bg-gray-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-500">Masa berlaku lisensi (hari)</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={form.mtLicenseValidityDays}
              onChange={(e) => setForm((f) => ({ ...f, mtLicenseValidityDays: e.target.value }))}
              disabled={!sellerConfigured}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            disabled={!sellerConfigured}
            className="rounded border-gray-300"
          />
          Publikasikan (muncul di /indikator/gmrfx dan /indikator)
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-gray-500">
            File {editId ? "(opsional ganti)" : "(wajib)"}
          </span>
          <input
            type="file"
            required={!editId}
            accept=".zip,.ex4,.ex5,.mq4,.mq5"
            disabled={!sellerConfigured}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-blue-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:opacity-50"
          />
        </label>

        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={saving || !sellerConfigured}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : editId ? "Simpan perubahan" : "Simpan indikator GMRFX"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Daftar indikator resmi</h2>
        {loading ? (
          <p className="mt-3 text-sm text-gray-500">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Belum ada indikator GMRFX.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{it.title}</p>
                  <p className="text-xs text-gray-500">
                    {it.published ? "Publik" : "Draft"} · {formatMarketplacePlatformLabel(it.platform)} ·{" "}
                    {it.priceIdr <= 0 ? "Gratis" : `Rp ${it.priceIdr.toLocaleString("id-ID")}`} · {it.purchaseCount}{" "}
                    pembelian
                    {it.mtLicenseProductCode
                      ? ` · Lisensi: ${it.mtLicenseProductCode} (${it.mtLicenseValidityDays ?? 365} hari)`
                      : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <Link
                      href={`/indikator/${it.slug}`}
                      target="_blank"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Halaman publik
                    </Link>
                    <Link href="/indikator/gmrfx" target="_blank" className="text-violet-700 hover:underline">
                      Katalog GMRFX
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(it)}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
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
