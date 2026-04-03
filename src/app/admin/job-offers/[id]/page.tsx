import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminJobResolvePanel } from "./AdminJobResolvePanel";

export const metadata: Metadata = { title: "Detail Penawaran — Admin GMR FX" };
export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka", ASSIGNED: "Sedang dikerjakan", DELIVERED: "Menunggu konfirmasi",
  COMPLETED: "Selesai", CANCELLED: "Dibatalkan", DISPUTED: "Sengketa",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-emerald-700 bg-emerald-50 border-emerald-200",
  ASSIGNED: "text-blue-700 bg-blue-50 border-blue-200",
  DELIVERED: "text-amber-700 bg-amber-50 border-amber-200",
  COMPLETED: "text-gray-500 bg-gray-100 border-gray-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
  DISPUTED: "text-orange-700 bg-orange-50 border-orange-200",
};
const BID_COLOR: Record<string, string> = {
  PENDING: "text-gray-500 bg-gray-50",
  SELECTED: "text-emerald-700 bg-emerald-50",
  REJECTED: "text-red-500 bg-red-50",
};

function fmtIdr(v: { toString(): string }) {
  return Number(v.toString()).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}
function fmtDT(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminJobDetailPage({ params }: Props) {
  const job = await prisma.jobOffer.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      winner: { select: { id: true, name: true, email: true } },
      bids: {
        orderBy: [{ priceIdr: "asc" }, { createdAt: "asc" }],
        include: { bidder: { select: { id: true, name: true, email: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
      deliverables: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!job) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/job-offers" className="text-indigo-600 hover:underline">Penawaran Pekerjaan</Link>
          <span>/</span>
          <span className="truncate max-w-[200px] text-gray-700">{job.title}</span>
        </div>
        <Link href={`/penawaran/${job.id}`} target="_blank" className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
          Lihat halaman publik →
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[job.status] ?? ""}`}>
                {STATUS_LABEL[job.status] ?? job.status}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-500">{job.category}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{job.title}</h1>
            <p className="mt-1 text-xs text-gray-500">
              ID: <code className="font-mono">{job.id}</code> ·
              Dibuat: {fmtDT(job.createdAt)} ·
              Expires: {fmtDT(job.expiresAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">Rp {fmtIdr(job.budgetIdr)}</p>
            <p className="text-xs text-gray-400">budget dikunci</p>
          </div>
        </div>

        {/* Pihak terlibat */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCell label="Pemberi Kerja" value={job.requester.name ?? "—"} sub={job.requester.email} />
          <InfoCell label="Pemenang" value={job.winner?.name ?? "Belum dipilih"} sub={job.winner?.email ?? ""} />
          <InfoCell label="Jumlah Pelamar" value={String(job.bids.length)} />
          <InfoCell label="Deliverable" value={String(job.deliverables.length) + " file"} />
        </div>

        {job.deliveredAt && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InfoCell label="Dikirim Pemenang" value={fmtDT(job.deliveredAt)} />
            <InfoCell label="Auto-Release" value={fmtDT(job.autoReleaseAt)} />
            <InfoCell label="Selesai" value={fmtDT(job.completedAt)} />
          </div>
        )}

        {job.disputeReason && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5">
            <p className="text-xs font-semibold text-orange-700">Alasan Komplain dari Pemberi Kerja:</p>
            <p className="mt-0.5 text-sm text-orange-800">{job.disputeReason}</p>
          </div>
        )}

        {job.adminNote && (
          <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5">
            <p className="text-xs font-semibold text-indigo-700">Catatan Admin:</p>
            <p className="mt-0.5 text-sm text-indigo-800">{job.adminNote}</p>
          </div>
        )}

        {job.attachmentUrl && (
          <div className="mt-3">
            <a href={job.attachmentUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100">
              📄 {job.attachmentName ?? "Lampiran PDF"} — Buka ↗
            </a>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Kolom kiri: Deskripsi + Komentar + Deliverable */}
        <div className="lg:col-span-2 space-y-5">
          {/* Deskripsi */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Deskripsi Pekerjaan</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>

          {/* Deliverable */}
          {job.deliverables.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">File Hasil Kerja</h2>
              <div className="space-y-2">
                {job.deliverables.map((d) => (
                  <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-indigo-600 hover:bg-gray-100 transition">
                    📦 <span className="min-w-0 truncate">{d.fileName}</span>
                    {d.note && <span className="text-xs text-gray-400 truncate">· {d.note}</span>}
                    <span className="ml-auto text-xs text-gray-400 shrink-0">{fmtDT(d.createdAt)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Komentar privat */}
          {job.comments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Diskusi Privat ({job.comments.length} pesan)
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {job.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-700">{c.author.name ?? "?"}</p>
                      <p className="text-[10px] text-gray-400">{fmtDT(c.createdAt)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolom kanan: Bid list + Panel Aksi Admin */}
        <div className="space-y-5">
          {/* Daftar bid */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{job.bids.length} Pelamar</h2>
            <div className="space-y-2">
              {job.bids.map((bid) => (
                <div key={bid.id} className={`rounded-lg border px-3 py-2.5 text-xs ${BID_COLOR[bid.status] ?? ""}`}>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-gray-900 truncate">{bid.bidder.name ?? "?"}</span>
                    <span className="shrink-0 font-bold text-gray-900">Rp {fmtIdr(bid.priceIdr)}</span>
                  </div>
                  <p className="text-gray-500 line-clamp-2">{bid.message}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{bid.bidder.email}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${BID_COLOR[bid.status]}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
              ))}
              {job.bids.length === 0 && <p className="text-xs text-gray-400">Belum ada pelamar</p>}
            </div>
          </div>

          {/* Panel aksi admin */}
          <AdminJobResolvePanel
            jobId={job.id}
            status={job.status}
            budgetIdr={job.budgetIdr.toString()}
            requesterName={job.requester.name ?? "Pemberi Kerja"}
            winnerName={job.winner?.name ?? null}
            currentNote={job.adminNote ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-800 truncate">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
    </div>
  );
}
