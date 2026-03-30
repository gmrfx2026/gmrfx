"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminHomeNewsRssImport() {
  const router = useRouter();
  const [feedUrl, setFeedUrl] = useState("");
  const [scope, setScope] = useState<"DOMESTIC" | "INTERNATIONAL">("DOMESTIC");
  const [maxItems, setMaxItems] = useState(8);
  const [paraphrase, setParaphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/home-news/import-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl, scope, maxItems, paraphrase }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        created?: number;
        skipped?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        setMessage(data.error ?? "Gagal");
        return;
      }
      const errLines = (data.errors ?? []).slice(0, 5).join(" · ");
      setMessage(
        `Ditambah: ${data.created ?? 0}, dilewati (duplikat/kosong): ${data.skipped ?? 0}.` +
          (errLines ? ` Peringatan: ${errLines}` : "")
      );
      router.refresh();
    } catch {
      setMessage("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800">Impor dari RSS</h2>
      <p className="mt-1 text-xs text-gray-600">
        Masukkan URL feed RSS/Atom. Gambar (enclosure atau &lt;img&gt; pertama) diunduh ke penyimpanan situs bila memungkinkan.
        Tanpa parafrase AI, isi disanitasi dari feed (bisa mirip sumber). Centang parafrase hanya jika{" "}
        <code className="rounded bg-gray-100 px-0.5">OPENAI_API_KEY</code> sudah di env production.
      </p>
      <label className="mt-3 block text-xs font-medium text-gray-700">URL feed</label>
      <input
        type="url"
        required
        value={feedUrl}
        onChange={(e) => setFeedUrl(e.target.value)}
        placeholder="https://contoh.com/rss.xml"
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <span>Kategori</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "DOMESTIC" | "INTERNATIONAL")}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="DOMESTIC">Dalam negeri</option>
            <option value="INTERNATIONAL">Internasional</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Maks. item
          <input
            type="number"
            min={1}
            max={20}
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value) || 8)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={paraphrase}
            onChange={(e) => setParaphrase(e.target.checked)}
          />
          Parafrase OpenAI
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Mengimpor…" : "Jalankan impor"}
      </button>
      {message ? <p className="mt-3 text-sm text-gray-800">{message}</p> : null}
    </form>
  );
}
