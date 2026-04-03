"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl border border-broker-border bg-broker-surface/20" /> }
);

const CATEGORIES = [
  { value: "EA", label: "Expert Advisor (EA)" },
  { value: "INDICATOR", label: "Indikator / Strategi" },
  { value: "OTHER", label: "Lainnya" },
];

function fmtIdr(v: number) {
  return v.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function BuatPenawaranPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("EA");
  const [budget, setBudget] = useState("");
  const [expireDays, setExpireDays] = useState("30");

  // PDF attachment
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [pdfErr, setPdfErr] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const budgetNum = parseFloat(budget.replace(/\./g, "").replace(",", ".")) || 0;
  const descText = stripHtml(description);

  async function handlePdfChange(file: File | null) {
    if (!file) return;
    setPdfErr("");
    if (file.size > 10 * 1024 * 1024) { setPdfErr("PDF maks 10 MB"); return; }
    if (!file.name.toLowerCase().endsWith(".pdf")) { setPdfErr("Hanya file .pdf"); return; }
    setPdfFile(file);
    setPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/penawaran/upload-attachment", { method: "POST", body: fd });
      const j = (await r.json()) as { ok?: boolean; url?: string; fileName?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Upload gagal");
      setPdfUrl(j.url ?? "");
      setPdfName(j.fileName ?? file.name);
    } catch (e) {
      setPdfErr(e instanceof Error ? e.message : "Upload gagal");
      setPdfFile(null);
    } finally {
      setPdfUploading(false);
    }
  }

  function removePdf() {
    setPdfFile(null);
    setPdfUrl("");
    setPdfName("");
    setPdfErr("");
    if (pdfRef.current) pdfRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Judul wajib diisi"); return; }
    if (descText.length < 20) { setError("Deskripsi minimal 20 karakter konten"); return; }
    if (budgetNum < 10000) { setError("Budget minimal Rp 10.000"); return; }
    if (pdfUploading) { setError("Tunggu hingga PDF selesai diupload"); return; }
    if (!confirm(`Dana Rp ${fmtIdr(budgetNum)} akan dikunci dari wallet Anda. Lanjutkan?`)) return;

    setBusy(true);
    try {
      const r = await fetch("/api/penawaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          budgetIdr: budgetNum,
          expireDays: parseInt(expireDays, 10),
          attachmentUrl: pdfUrl || null,
          attachmentName: pdfName || null,
        }),
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs text-broker-muted">
        <Link href="/penawaran" className="text-broker-accent hover:underline">← Penawaran Pekerjaan</Link>
      </p>
      <h1 className="mt-3 text-2xl font-bold text-white">Buat Penawaran Pekerjaan</h1>
      <p className="mt-1 text-sm text-broker-muted">
        Jelaskan EA atau indikator yang Anda butuhkan. Sertakan gambar flowchart dan PDF spesifikasi agar freelancer lebih mudah memahami.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
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

        {/* Deskripsi — Rich Text Editor */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Deskripsi & Spesifikasi <span className="text-red-400">*</span>
          </label>
          <p className="mb-2 text-xs text-broker-muted/70">
            Gunakan toolbar untuk format teks, buat list, tabel, atau sisipkan gambar (flowchart, screenshot, dll). Maks gambar 2,5 MB per file.
          </p>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder={`Jelaskan secara detail:\n• Platform: MT4 / MT5\n• Fitur yang diinginkan\n• Parameter yang bisa diatur\n• Timeframe dan pair\n• Logika entry/exit\n• Referensi jika ada`}
          />
          <p className={`mt-1 text-[11px] ${descText.length < 20 ? "text-amber-400/70" : "text-broker-muted/60"}`}>
            {descText.length} karakter konten (min 20)
          </p>
        </div>

        {/* Upload PDF */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Lampiran PDF Spesifikasi <span className="text-broker-muted/50">(opsional)</span>
          </label>
          <p className="mb-2 text-xs text-broker-muted/70">
            Upload dokumen PDF untuk spesifikasi yang lebih detail: wireframe, flowchart EA, pseudocode, atau referensi strategi. Maks 10 MB.
          </p>
          <input
            ref={pdfRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => void handlePdfChange(e.target.files?.[0] ?? null)}
          />
          {!pdfFile ? (
            <button
              type="button"
              onClick={() => pdfRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-dashed border-broker-border/60 bg-broker-bg/20 px-5 py-4 text-sm text-broker-muted hover:border-broker-accent/40 hover:text-white transition w-full justify-center"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Klik untuk upload PDF
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-broker-border/60 bg-broker-bg/30 px-4 py-3">
              <svg className="h-8 w-8 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{pdfName || pdfFile.name}</p>
                <p className="text-xs text-broker-muted">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                {pdfUploading && <p className="text-xs text-amber-400 animate-pulse">Mengupload…</p>}
                {pdfUrl && !pdfUploading && <p className="text-xs text-emerald-400">✓ Berhasil diupload</p>}
              </div>
              <button type="button" onClick={removePdf} className="shrink-0 text-broker-muted hover:text-red-400 transition">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {pdfErr && <p className="mt-1 text-xs text-red-400">{pdfErr}</p>}
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
            <p className="mt-0.5 text-[11px] text-broker-gold">
              = Rp {fmtIdr(budgetNum)} akan dikunci dari wallet Anda
            </p>
          )}
        </div>

        {/* Masa berlaku */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-broker-muted mb-1.5">
            Masa Penerimaan Lamaran
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
            disabled={busy || pdfUploading}
            className="flex-1 rounded-xl bg-broker-accent py-2.5 text-sm font-semibold text-broker-bg disabled:opacity-50 hover:opacity-90 transition"
          >
            {busy ? "Memposting…" : pdfUploading ? "Menunggu upload PDF…" : `Posting & Kunci Dana Rp ${budgetNum >= 10000 ? fmtIdr(budgetNum) : "—"}`}
          </button>
        </div>
      </form>
    </div>
  );
}
