"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminHomeNewsRssImport({
  savedDomesticUrl,
  savedInternationalUrl,
}: {
  savedDomesticUrl: string;
  savedInternationalUrl: string;
}) {
  const router = useRouter();
  const [feedUrl, setFeedUrl] = useState("");
  const [scope, setScope] = useState<"DOMESTIC" | "INTERNATIONAL">("DOMESTIC");
  const [maxItems, setMaxItems] = useState(8);
  const [paraphrase, setParaphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runImport(url: string, sc: "DOMESTIC" | "INTERNATIONAL") {
    const u = url.trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) {
      setMessage("URL feed harus diawali http:// atau https://");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/home-news/import-rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl: u, scope: sc, maxItems, paraphrase }),
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runImport(feedUrl, scope);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800">Impor dari RSS</h2>
      <p className="mt-1 text-xs text-gray-600">
        URL default bisa disetel di <strong>Admin → Pengaturan</strong>. Tombol di bawah memakai URL tersimpan +
        opsi parafrase &amp; jumlah item di form ini.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !savedDomesticUrl.trim()}
          onClick={() => {
            setScope("DOMESTIC");
            setFeedUrl(savedDomesticUrl);
            void runImport(savedDomesticUrl, "DOMESTIC");
          }}
          className="rounded-md border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-40"
        >
          Impor feed tersimpan (dalam negeri)
        </button>
        <button
          type="button"
          disabled={loading || !savedInternationalUrl.trim()}
          onClick={() => {
            setScope("INTERNATIONAL");
            setFeedUrl(savedInternationalUrl);
            void runImport(savedInternationalUrl, "INTERNATIONAL");
          }}
          className="rounded-md border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-40"
        >
          Impor feed tersimpan (internasional)
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {savedDomesticUrl.trim()
          ? `Dalam negeri: ${savedDomesticUrl.slice(0, 72)}${savedDomesticUrl.length > 72 ? "…" : ""}`
          : "Dalam negeri: belum disetel di Pengaturan."}
        <br />
        {savedInternationalUrl.trim()
          ? `Internasional: ${savedInternationalUrl.slice(0, 72)}${savedInternationalUrl.length > 72 ? "…" : ""}`
          : "Internasional: belum disetel di Pengaturan."}
      </p>
      <label className="mt-3 block text-xs font-medium text-gray-700">URL feed (manual)</label>
      <input
        type="url"
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
        disabled={loading || !feedUrl.trim()}
        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Mengimpor…" : "Jalankan impor (URL manual)"}
      </button>
      {message ? <p className="mt-3 text-sm text-gray-800">{message}</p> : null}
    </form>
  );
}
