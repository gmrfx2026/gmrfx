"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "upsert" | "create_new";

export function AdminImportEducationalArticles() {
  const router = useRouter();
  const [loading, setLoading] = useState<Mode | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onImport(mode: Mode) {
    setLoading(mode);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/articles/seed-educational", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        count?: number;
        penulis?: string;
        authorDisplay?: string;
        mode?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Permintaan gagal" });
        return;
      }
      if (data.ok && data.count != null) {
        const modeLabel = data.mode === "create_new" ? "8 artikel baru" : "perbarui 8 artikel utama";
        setMessage({
          type: "ok",
          text: `${modeLabel} · ${data.count} entri · penulis: ${data.penulis} (${data.authorDisplay ?? "—"}) · istilah broker memakai tautan /go`,
        });
        router.refresh();
        return;
      }
      setMessage({ type: "err", text: "Respons tidak dikenal" });
    } catch {
      setMessage({ type: "err", text: "Jaringan atau server error" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h2 className="text-sm font-semibold text-gray-800">Impor artikel edukasi</h2>
      <p className="mt-1 text-xs text-gray-600">
        Konten memuat tautan ke <code className="rounded bg-gray-200 px-0.5">/go</code> pada kata seperti broker, pialang,
        market maker, dan ECN/STP. Halaman /go membuka mitra Exness & Tickmill di tab baru dan mencatat statistik (Admin →
        Statistik /go).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => onImport("upsert")}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "upsert" ? "Memproses…" : "Perbarui 8 artikel utama"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => onImport("create_new")}
          className="rounded-md border border-emerald-700 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
        >
          {loading === "create_new" ? "Memproses…" : "Tambah 8 artikel baru (slug unik)"}
        </button>
      </div>
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
