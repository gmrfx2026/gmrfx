"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type User = { id: string; name: string | null; image: string | null; memberSlug: string | null };
type Bid = { id: string; bidderId: string; bidder: User; priceIdr: string; message: string; status: string; createdAt: string | Date };
type Deliverable = { id: string; fileName: string; fileUrl: string; note: string | null; createdAt: string | Date };
type Comment = { id: string; authorId: string; author: { id: string; name: string | null; image: string | null }; content: string; createdAt: string };

type Job = {
  id: string; title: string; description: string; category: string; budgetIdr: string; status: string;
  expiresAt: string; requester: User; winner: User | null; winnerId: string | null;
  bids: Bid[]; deliverables: Deliverable[];
  deliveredAt: string | null; autoReleaseAt: string | null; completedAt: string | null;
  createdAt: string; disputeReason: string | null; adminNote: string | null;
  attachmentUrl: string | null; attachmentName: string | null;
};

const CATEGORY_LABEL: Record<string, string> = { EA: "Expert Advisor", INDICATOR: "Indikator", OTHER: "Lainnya" };
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka", ASSIGNED: "Sedang dikerjakan", DELIVERED: "Menunggu konfirmasi",
  COMPLETED: "Selesai", CANCELLED: "Dibatalkan", DISPUTED: "Sengketa — menunggu admin",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
  ASSIGNED: "text-blue-400 border-blue-500/30 bg-blue-950/20",
  DELIVERED: "text-amber-400 border-amber-500/30 bg-amber-950/20",
  COMPLETED: "text-broker-muted border-broker-border bg-broker-surface/20",
  CANCELLED: "text-red-400 border-red-500/30 bg-red-950/20",
  DISPUTED: "text-orange-400 border-orange-500/30 bg-orange-950/20",
};

function fmtIdr(v: string | number) { return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 0 }); }
function fmtDate(s: string | Date) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
function fmtDateTime(s: string | Date) {
  return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ user, size = 32 }: { user: { name: string | null; image: string | null }; size?: number }) {
  if (user.image) return <Image src={user.image} alt={user.name ?? "?"} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return <div className="flex items-center justify-center rounded-full bg-broker-accent/20 text-broker-accent font-bold text-xs" style={{ width: size, height: size }}>{(user.name ?? "?")[0]?.toUpperCase()}</div>;
}

export function JobDetailClient({
  job, comments: initialComments, userId, isAdmin, canSeePrivate,
}: {
  job: Job; comments: Comment[]; userId: string | null; isAdmin: boolean; canSeePrivate: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [bidPrice, setBidPrice] = useState("");
  const [bidMsg, setBidMsg] = useState("");
  const [bidBusy, setBidBusy] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeBusy, setDisputeBusy] = useState(false);
  const [deliverNote, setDeliverNote] = useState("");
  const [delivering, setDelivering] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isRequester = userId === job.requester.id;
  const isWinner = userId === job.winnerId;
  const myBid = job.bids.find((b) => b.bidderId === userId);
  const alreadyBid = !!myBid;

  async function post(url: string, body: unknown) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r;
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentBusy(true);
    const r = await post(`/api/penawaran/${job.id}/comments`, { content: commentText });
    const j = (await r.json()) as { ok?: boolean; comment?: Comment };
    if (r.ok && j.comment) { setComments((c) => [...c, j.comment!]); setCommentText(""); }
    setCommentBusy(false);
  }

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(bidPrice) || 0;
    if (price < 1000 || !bidMsg.trim()) return;
    setBidBusy(true);
    setActionMsg("");
    const r = await post(`/api/penawaran/${job.id}/bid`, { priceIdr: price, message: bidMsg });
    const j = (await r.json()) as { ok?: boolean; error?: string };
    if (r.ok) { setActionMsg("✓ Tawaran Anda berhasil diajukan!"); router.refresh(); }
    else setActionMsg(`Error: ${j.error ?? "Gagal"}`);
    setBidBusy(false);
  }

  async function selectWinner(bidId: string) {
    if (!confirm("Pilih pemenang ini? Proses tidak bisa dibatalkan.")) return;
    const r = await post(`/api/penawaran/${job.id}/select`, { bidId });
    const j = (await r.json()) as { error?: string };
    if (r.ok) router.refresh();
    else alert(j.error ?? "Gagal");
  }

  async function confirmComplete() {
    if (!confirm("Konfirmasi pekerjaan selesai? Dana akan langsung dikirim ke pemenang.")) return;
    const r = await post(`/api/penawaran/${job.id}/confirm`, {});
    const j = (await r.json()) as { error?: string };
    if (r.ok) router.refresh();
    else alert(j.error ?? "Gagal");
  }

  async function submitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeBusy(true);
    const r = await post(`/api/penawaran/${job.id}/dispute`, { reason: disputeReason });
    const j = (await r.json()) as { error?: string };
    if (r.ok) router.refresh();
    else { alert(j.error ?? "Gagal"); setDisputeBusy(false); }
  }

  async function submitDeliver(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { alert("Pilih file terlebih dahulu"); return; }
    if (!confirm(`Kirim "${file.name}" sebagai hasil kerja? Status akan berubah ke DELIVERED.`)) return;
    setDelivering(true);
    const fd = new FormData();
    fd.append("file", file);
    if (deliverNote) fd.append("note", deliverNote);
    const r = await fetch(`/api/penawaran/${job.id}/deliver`, { method: "POST", body: fd });
    const j = (await r.json()) as { ok?: boolean; error?: string; autoReleaseAt?: string };
    if (r.ok) { router.refresh(); }
    else { alert(j.error ?? "Gagal mengirim file"); setDelivering(false); }
  }

  const canBid = !!userId && !isRequester && !isWinner && !alreadyBid && job.status === "OPEN" && new Date(job.expiresAt) > new Date();
  const canDeliver = isWinner && ["ASSIGNED", "DELIVERED"].includes(job.status);
  const canConfirm = isRequester && job.status === "DELIVERED";
  const canDispute = isRequester && job.status === "DELIVERED";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs text-broker-muted">
        <Link href="/penawaran" className="text-broker-accent hover:underline">← Penawaran Pekerjaan</Link>
      </p>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[job.status] ?? ""}`}>
              {STATUS_LABEL[job.status] ?? job.status}
            </span>
            <span className="rounded-full border border-broker-border/40 bg-broker-bg/30 px-2.5 py-0.5 text-xs text-broker-muted">
              {CATEGORY_LABEL[job.category] ?? job.category}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-white leading-snug">{job.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-broker-muted">
            <div className="flex items-center gap-1.5">
              <Avatar user={job.requester} size={18} />
              <span>{job.requester.name ?? "Member"}</span>
            </div>
            <span>Diposting {fmtDate(job.createdAt)}</span>
            <span>Tutup {fmtDate(job.expiresAt)}</span>
          </div>
        </div>
        <div className="rounded-xl border border-broker-gold/30 bg-broker-bg/30 px-5 py-3 text-right">
          <p className="text-2xl font-bold text-broker-gold">Rp {fmtIdr(job.budgetIdr)}</p>
          <p className="text-xs text-broker-muted">{job.bids.length} pelamar</p>
        </div>
      </div>

      {/* Admin note (dispute) */}
      {job.adminNote && (
        <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-950/20 px-4 py-3 text-sm text-orange-200">
          <strong>Catatan Admin:</strong> {job.adminNote}
        </div>
      )}
      {job.disputeReason && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          <strong>Alasan komplain:</strong> {job.disputeReason}
        </div>
      )}

      {/* Auto-release info */}
      {job.status === "DELIVERED" && job.autoReleaseAt && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          Dana akan otomatis dikirim ke pemenang pada{" "}
          <strong>{fmtDateTime(job.autoReleaseAt)}</strong> jika tidak ada komplain.
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Deskripsi + aksi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deskripsi */}
          <section className="rounded-xl border border-broker-border bg-broker-surface/30 p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Deskripsi Pekerjaan</h2>
            <div
              className="prose prose-invert prose-sm max-w-none prose-a:text-broker-accent prose-img:rounded-xl prose-img:border prose-img:border-broker-border/40 prose-table:text-xs"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </section>

          {/* Lampiran PDF */}
          {job.attachmentUrl && (
            <section className="rounded-xl border border-broker-border bg-broker-surface/30 p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Lampiran Spesifikasi</h2>
              <a
                href={job.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/10 px-4 py-3 text-sm text-red-300 hover:bg-red-950/25 transition"
              >
                <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium">{job.attachmentName ?? "Spesifikasi.pdf"}</p>
                  <p className="text-xs text-red-400/70">Klik untuk buka / unduh PDF</p>
                </div>
                <svg className="ml-auto h-4 w-4 shrink-0 text-red-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </section>
          )}

          {/* Deliverables (hanya requester/winner/admin) */}
          {canSeePrivate && job.deliverables.length > 0 && (
            <section className="rounded-xl border border-broker-border bg-broker-surface/30 p-5">
              <h2 className="text-sm font-semibold text-white mb-3">File Hasil Kerja</h2>
              <div className="space-y-2">
                {job.deliverables.map((d) => (
                  <a
                    key={d.id}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-broker-border/60 bg-broker-bg/30 px-4 py-2.5 text-sm text-broker-accent hover:bg-broker-bg/50 transition"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.fileName}</p>
                      {d.note && <p className="text-xs text-broker-muted">{d.note}</p>}
                      <p className="text-[10px] text-broker-muted/70">{fmtDateTime(d.createdAt)}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Form kirim hasil (pemenang) */}
          {canDeliver && (
            <section className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-5">
              <h2 className="text-sm font-semibold text-white mb-1">Kirim Hasil Kerja</h2>
              <p className="mb-3 text-xs text-broker-muted">Upload file EA/indikator (.zip .ex4 .ex5 .mq4 .mq5, maks 20MB). Setelah terkirim, pemberi kerja punya 3 hari untuk konfirmasi.</p>
              <form onSubmit={(e) => void submitDeliver(e)} className="space-y-3">
                <input ref={fileRef} type="file" accept=".zip,.ex4,.ex5,.mq4,.mq5" className="block w-full text-sm text-broker-muted file:mr-3 file:rounded-lg file:border file:border-broker-border file:bg-broker-bg/40 file:px-3 file:py-1.5 file:text-xs file:text-white" />
                <input value={deliverNote} onChange={(e) => setDeliverNote(e.target.value)} maxLength={500} placeholder="Catatan (opsional)" className="w-full rounded-xl border border-broker-border bg-broker-bg/40 px-4 py-2 text-sm text-white placeholder:text-broker-muted/40" />
                <button type="submit" disabled={delivering} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-500 transition">
                  {delivering ? "Mengirim…" : "Kirim Hasil Kerja"}
                </button>
              </form>
            </section>
          )}

          {/* Konfirmasi & Komplain (pemberi kerja, status DELIVERED) */}
          {(canConfirm || canDispute) && (
            <section className="rounded-xl border border-broker-border bg-broker-surface/30 p-5 space-y-4">
              {canConfirm && (
                <div>
                  <h2 className="text-sm font-semibold text-white mb-1">Konfirmasi Selesai</h2>
                  <p className="mb-2 text-xs text-broker-muted">Jika hasil kerja sudah sesuai, klik konfirmasi untuk langsung mencairkan dana ke pemenang.</p>
                  <button onClick={() => void confirmComplete()} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">
                    ✓ Konfirmasi & Cairkan Dana
                  </button>
                </div>
              )}
              {canDispute && (
                <div className="border-t border-broker-border/40 pt-4">
                  <h2 className="text-sm font-semibold text-white mb-1">Ajukan Komplain</h2>
                  <p className="mb-2 text-xs text-broker-muted">Jika ada masalah dengan hasil kerja, ajukan komplain — admin akan memutuskan.</p>
                  <form onSubmit={(e) => void submitDispute(e)} className="flex gap-2">
                    <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Jelaskan alasan komplain (min 10 karakter)" maxLength={1000} className="flex-1 rounded-xl border border-broker-border bg-broker-bg/40 px-4 py-2 text-sm text-white placeholder:text-broker-muted/40" />
                    <button type="submit" disabled={disputeBusy || disputeReason.trim().length < 10} className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-50 hover:bg-red-950/50 transition">
                      Komplain
                    </button>
                  </form>
                </div>
              )}
            </section>
          )}

          {/* Komentar privat */}
          {canSeePrivate && (
            <section className="rounded-xl border border-broker-border bg-broker-surface/30 p-5">
              <h2 className="text-sm font-semibold text-white mb-1">
                Diskusi Privat
                <span className="ml-2 text-[10px] font-normal text-broker-muted">(hanya pemberi kerja & pemenang)</span>
              </h2>
              <div className="mt-3 space-y-3 max-h-72 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-broker-muted">Belum ada pesan.</p>}
                {comments.map((c) => (
                  <div key={c.id} className={`flex gap-2.5 ${c.authorId === userId ? "flex-row-reverse" : ""}`}>
                    <Avatar user={c.author} size={28} />
                    <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${c.authorId === userId ? "bg-broker-accent/15 text-white" : "bg-broker-bg/40 text-broker-muted"}`}>
                      <p>{c.content}</p>
                      <p className="mt-0.5 text-[10px] text-broker-muted/60">{fmtDateTime(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {userId && !["COMPLETED", "CANCELLED"].includes(job.status) && (
                <form onSubmit={(e) => void sendComment(e)} className="mt-3 flex gap-2">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={2000} placeholder="Tulis pesan…" className="flex-1 rounded-xl border border-broker-border bg-broker-bg/40 px-4 py-2 text-sm text-white placeholder:text-broker-muted/40" />
                  <button type="submit" disabled={commentBusy || !commentText.trim()} className="rounded-xl bg-broker-accent/20 border border-broker-accent/40 px-4 py-2 text-sm text-broker-accent disabled:opacity-40 hover:bg-broker-accent/30 transition">
                    Kirim
                  </button>
                </form>
              )}
            </section>
          )}
        </div>

        {/* Sidebar: Daftar tawaran */}
        <div className="space-y-4">
          <section className="rounded-xl border border-broker-border bg-broker-surface/30 p-4">
            <h2 className="text-sm font-semibold text-white mb-1">{job.bids.length} Pelamar</h2>
          <p className="text-[10px] text-broker-muted mb-3">Diurutkan harga terendah · Anda pilih pemenangnya</p>

            {job.bids.length === 0 && <p className="text-xs text-broker-muted">Belum ada yang mengajukan tawaran.</p>}

            <div className="space-y-3">
              {job.bids.map((bid) => (
                <div
                  key={bid.id}
                  className={`rounded-xl border p-3 text-xs transition ${
                    bid.status === "SELECTED"
                      ? "border-emerald-500/40 bg-emerald-950/20"
                      : bid.status === "REJECTED"
                      ? "border-broker-border/30 bg-broker-bg/10 opacity-50"
                      : "border-broker-border bg-broker-bg/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar user={bid.bidder} size={22} />
                    <span className="font-semibold text-white">{bid.bidder.name ?? "Member"}</span>
                    {bid.status === "SELECTED" && <span className="ml-auto text-emerald-400 font-semibold">✓ Terpilih</span>}
                    {bid.status === "REJECTED" && <span className="ml-auto text-red-400">Ditolak</span>}
                  </div>
                  <p className="text-broker-gold font-bold text-sm">Rp {fmtIdr(bid.priceIdr)}</p>
                  <p className="mt-1 text-broker-muted line-clamp-3">{bid.message}</p>
                  <p className="mt-1 text-[10px] text-broker-muted/60">{fmtDateTime(bid.createdAt)}</p>

                  {/* Tombol pilih (hanya requester, status OPEN) */}
                  {isRequester && job.status === "OPEN" && bid.status === "PENDING" && (
                    <button
                      onClick={() => void selectWinner(bid.id)}
                      className="mt-2 w-full rounded-lg bg-broker-accent px-3 py-1.5 text-xs font-semibold text-broker-bg hover:opacity-90 transition"
                    >
                      Pilih sebagai Pemenang
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Form ajukan tawaran */}
          {canBid && (
            <section className="rounded-xl border border-broker-accent/30 bg-broker-accent/5 p-4">
              <h2 className="text-sm font-semibold text-white mb-1">Ajukan Lamaran</h2>
              <p className="text-[10px] text-broker-muted mb-3">
                Tawarkan harga di bawah budget maksimal pemberi kerja{" "}
                <strong className="text-broker-gold">(Rp {fmtIdr(job.budgetIdr)})</strong>.
                Pemberi kerja akan memilih pemenang dari semua pelamar.
              </p>
              <form onSubmit={(e) => void submitBid(e)} className="space-y-3">
                <div>
                  <label className="text-xs text-broker-muted">Harga yang Anda minta (IDR)</label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-broker-muted">Rp</span>
                    <input type="number" min={1000} max={Number(job.budgetIdr)} step={1000} value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} placeholder={String(Math.floor(Number(job.budgetIdr) * 0.8))} className="w-full rounded-xl border border-broker-border bg-broker-bg/40 py-2 pl-9 pr-3 text-sm text-white" />
                  </div>
                  {parseFloat(bidPrice) > 0 && (
                    <p className={`mt-0.5 text-[10px] ${parseFloat(bidPrice) > Number(job.budgetIdr) ? "text-red-400" : "text-broker-muted/70"}`}>
                      {parseFloat(bidPrice) > Number(job.budgetIdr)
                        ? `⚠ Melebihi budget (maks Rp ${fmtIdr(job.budgetIdr)})`
                        : `Hemat Rp ${fmtIdr(Number(job.budgetIdr) - parseFloat(bidPrice))} dari budget`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-broker-muted">Pesan / portofolio singkat</label>
                  <textarea value={bidMsg} onChange={(e) => setBidMsg(e.target.value)} maxLength={1000} rows={4} placeholder="Jelaskan pengalaman dan pendekatan Anda…" className="mt-1 w-full rounded-xl border border-broker-border bg-broker-bg/40 px-3 py-2 text-sm text-white placeholder:text-broker-muted/40 resize-none" />
                </div>
                {actionMsg && (
                  <p className={`text-xs ${actionMsg.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{actionMsg}</p>
                )}
                <button type="submit" disabled={bidBusy} className="w-full rounded-xl bg-broker-accent py-2 text-sm font-semibold text-broker-bg disabled:opacity-50 hover:opacity-90 transition">
                  {bidBusy ? "Mengirim…" : "Kirim Tawaran"}
                </button>
              </form>
            </section>
          )}

          {alreadyBid && (
            <div className="rounded-xl border border-broker-border bg-broker-surface/20 p-4 text-xs text-broker-muted">
              Anda sudah mengajukan tawaran <strong className="text-broker-gold">Rp {fmtIdr(myBid!.priceIdr)}</strong>.
            </div>
          )}

          {/* Info pemenang */}
          {job.winner && (
            <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
              <p className="text-xs text-emerald-400 font-semibold mb-2">Pemenang</p>
              <div className="flex items-center gap-2">
                <Avatar user={job.winner} size={32} />
                <div>
                  <p className="text-sm font-semibold text-white">{job.winner.name ?? "Member"}</p>
                  {job.completedAt && <p className="text-xs text-broker-muted">Selesai {fmtDate(job.completedAt)}</p>}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
