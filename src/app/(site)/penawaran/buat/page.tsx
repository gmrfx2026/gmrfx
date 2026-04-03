"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { value: "EA", label: "Expert Advisor (EA)" },
  { value: "INDICATOR", label: "Indikator / Strategi" },
  { value: "OTHER", label: "Lainnya" },
];

function fmtIdr(v: number) {
  return v.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export default function BuatPenawaranPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("EA");
  const [budget, setBudget] = useState("");
  const [expireDays, setExpireDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const budgetNum = parseFloat(budget.replace(/\./g, "").replace(",", ".")) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Judul wajib diisi"); return; }
    if (description.trim().length < 20) { setError("Deskripsi minimal 20 karakter"); return; }
    if (budgetNum < 10000) { setError("Budget minimal Rp 10.000"); return; }
    if (!confirm(`Dana Rp ${fmtIdr(budgetNum)} akan dikunci dari wallet Anda. Lanjutkan?`)) return;

    setBusy(true);
    try {
      const r = await fetch("/api/penawaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, budgetIdr: budgetNum, expireDays: parseInt(expireDays, 10) }),
      });
      const j = (await r.json()) as { ok?: boolean; jobId?: string; error?: string };
      if (!r.ok) { setError(j.error ?? "Gagal membuat penawaran"); return; }
      router.push(`/penawaran/${j.jobId!}`);
    } catch {
      setError("Jaringan error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs text-broker-muted">
        <Link href="/penawaran" className="text-broker-accent hover:underline">← Penawaran Pekerjaan</Link>
      </p>
      <h1 className="mt-3 text-2xl font-bold text-white">Buat Penawaran Pekerjaan</h1>
      <p className="mt-1 text-sm text-broker-muted">
        Jelaskan EA atau indikator yang Anda butuhkan. Budget dikunci dari wallet saat diposting.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
        {/* Kategori */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-2">Kategori</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  category === c.value
                    ? "border-broker-accent bg-broker-accent/10 text-broker-accent"
                    : "border-broker-border text-broker-muted hover:border-broker-accent/40"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Judul */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Judul Pekerjaan <span className="text-red-400">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="mis. Buat EA scalping XAUUSD dengan trailing stop"
            className="w-full rounded-xl border border-broker-border bg-broker-bg/40 px-4 py-2.5 text-sm text-white placeholder:text-broker-muted/40"
          />
          <p className="mt-1 text-[11px] text-broker-muted/60">{title.length}/200</p>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Deskripsi & Spesifikasi <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder={`Jelaskan secara detail:\n- Platform: MT4 / MT5\n- Fitur yang diinginkan\n- Parameter yang bisa diatur\n- Timeframe dan pair\n- Logika entry/exit\n- Referensi jika ada`}
            className="w-full rounded-xl border border-broker-border bg-broker-bg/40 px-4 py-2.5 text-sm text-white placeholder:text-broker-muted/40 resize-none"
          />
          <p className={`mt-1 text-[11px] ${description.length < 20 ? "text-red-400/70" : "text-broker-muted/60"}`}>
            {description.length} karakter (min 20)
          </p>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Budget Maksimal (IDR) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-broker-muted">Rp</span>
            <input
              type="number"
              min={10000}
              step={1000}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50000"
              className="w-full rounded-xl border border-broker-border bg-broker-bg/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-broker-muted/40"
            />
          </div>
          <p className="mt-1 text-[11px] text-broker-muted/70">
            Freelancer akan menawar di bawah atau sama dengan angka ini. Anda bebas memilih pemenang berdasarkan harga dan proposal terbaik.
          </p>
          {budgetNum >= 10000 && (
            <p className="mt-1 text-[11px] text-broker-gold">
              = Rp {fmtIdr(budgetNum)} akan dikunci dari wallet Anda
            </p>
          )}
        </div>

        {/* Masa berlaku */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Masa Penerimaan Tawaran
          </label>
          <select
            value={expireDays}
            onChange={(e) => setExpireDays(e.target.value)}
            className="rounded-xl border border-broker-border bg-broker-bg/40 px-4 py-2.5 text-sm text-white"
          >
            <option value="7">7 hari</option>
            <option value="14">14 hari</option>
            <option value="30">30 hari (default)</option>
            <option value="60">60 hari</option>
            <option value="90">90 hari</option>
          </select>
        </div>

        {/* Warning */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 px-4 py-3 text-xs text-amber-300 space-y-1">
          <p className="font-semibold">⚠ Penting sebelum posting:</p>
          <p>• Budget akan langsung dipotong dari wallet Anda saat menekan Posting.</p>
          <p>• Jika masa berlaku habis tanpa pemenang, dana dikembalikan otomatis.</p>
          <p>• Setelah pemenang dipilih, pekerjaan tidak bisa dibatalkan kecuali melalui admin.</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Link
            href="/penawaran"
            className="rounded-xl border border-broker-border px-5 py-2.5 text-sm text-broker-muted hover:text-white transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl bg-broker-accent py-2.5 text-sm font-semibold text-broker-bg disabled:opacity-50 hover:opacity-90 transition"
          >
            {busy ? "Memposting…" : `Posting & Kunci Dana Rp ${budgetNum >= 10000 ? fmtIdr(budgetNum) : "—"}`}
          </button>
        </div>
      </form>
    </div>
  );
}
