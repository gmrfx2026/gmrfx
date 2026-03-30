"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminImportEducationalArticles() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onImport() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/articles/seed-educational", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        count?: number;
        penulis?: string;
        authorDisplay?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Permintaan gagal" });
        return;
      }
      if (data.ok && data.count != null) {
        setMessage({
          type: "ok",
          text: `${data.count} artikel edukasi diperbarui/dibuat · penulis: ${data.penulis} (${data.authorDisplay ?? "—"})`,
        });
        router.refresh();
        return;
      }
      setMessage({ type: "err", text: "Respons tidak dikenal" });
    } catch {
      setMessage({ type: "err", text: "Jaringan atau server error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h2 className="text-sm font-semibold text-gray-800">Impor artikel edukasi</h2>
      <p className="mt-1 text-xs text-gray-600">
        Meng-upsert 8 artikel edukasi (PUBLISHED) ke database yang dipakai situs ini. Slug yang sama akan ditimpa
        konten seed.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={onImport}
        className="mt-3 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Memproses…" : "Impor 8 artikel edukasi"}
      </button>
      {message ? (
        <p
          className={`mt-2 text-sm ${message.type === "ok" ? "text-emerald-800" : "text-red-700"}`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
