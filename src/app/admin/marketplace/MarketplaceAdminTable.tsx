"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  title: string;
  slug: string;
  priceIdr: string;
  published: boolean;
  platform: string;
  sellerName: string | null;
  ratingCount: number;
  createdAt: string;
};

type Props = {
  products: Product[];
  kind: "indikator" | "ea";
};

function fmtIdr(v: string) { return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 0 }); }
function fmtDT(s: string) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }

function Row({ p, kind }: { p: Product; kind: "indikator" | "ea" }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const base = `/api/admin/marketplace/${kind}/${p.id}`;

  async function togglePublish() {
    setBusy(true); setMsg("");
    const r = await fetch(base, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    setBusy(false);
    if (r.ok) startTransition(() => router.refresh());
    else setMsg("Gagal");
  }

  async function handleDelete() {
    if (!confirm(`Hapus produk "${p.title}"? Tindakan ini permanen.`)) return;
    setBusy(true); setMsg("");
    const r = await fetch(base, { method: "DELETE" });
    setBusy(false);
    if (r.ok) startTransition(() => router.refresh());
    else setMsg("Gagal");
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 max-w-[220px]">
        <p className="font-medium text-gray-900 truncate">{p.title}</p>
        <p className="text-xs text-gray-400">{p.platform} · {p.sellerName ?? "?"}</p>
      </td>
      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
        {Number(p.priceIdr) <= 0 ? <span className="text-emerald-600 font-semibold">Gratis</span> : `Rp ${fmtIdr(p.priceIdr)}`}
      </td>
      <td className="px-4 py-3 text-center text-gray-500 text-xs">{p.ratingCount}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {p.published ? "Publik" : "Tersembunyi"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDT(p.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            disabled={busy}
            onClick={togglePublish}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40 ${
              p.published
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            }`}
          >
            {p.published ? "Sembunyikan" : "Publikasikan"}
          </button>
          <Link
            href={`/${kind === "indikator" ? "indikator" : "ea"}/${encodeURIComponent(p.slug)}`}
            target="_blank"
            className="text-xs text-indigo-500 hover:underline"
          >
            Lihat ↗
          </Link>
          <button
            disabled={busy}
            onClick={handleDelete}
            className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40 transition"
          >
            Hapus
          </button>
          {msg && <span className="text-xs text-red-400">{msg}</span>}
        </div>
      </td>
    </tr>
  );
}

export function MarketplaceAdminTable({ products, kind }: Props) {
  const [filter, setFilter] = useState<"all" | "published" | "hidden">("all");
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    if (filter === "published" && !p.published) return false;
    if (filter === "hidden" && p.published) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !(p.sellerName ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pubCount = products.filter((p) => p.published).length;
  const hidCount = products.length - pubCount;

  return (
    <div>
      {/* Stats */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: "Semua", val: "all" as const, count: products.length },
          { label: "Publik", val: "published" as const, count: pubCount },
          { label: "Tersembunyi", val: "hidden" as const, count: hidCount },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === f.val ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label} <span className="ml-1 text-gray-400">({f.count})</span>
          </button>
        ))}
        <input
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-indigo-300"
          placeholder="Cari judul / penjual…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Produk", "Harga", "Rating", "Status", "Tanggal", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => <Row key={p.id} p={p} kind={kind} />)}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
