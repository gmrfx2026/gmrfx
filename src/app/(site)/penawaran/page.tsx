import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJakarta } from "@/lib/jakartaDateFormat";

export const metadata: Metadata = { title: "Penawaran Pekerjaan — GMR FX" };
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = { EA: "Expert Advisor", INDICATOR: "Indikator", OTHER: "Lainnya" };
const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
  ASSIGNED: "text-blue-400 border-blue-500/30 bg-blue-950/20",
  DELIVERED: "text-amber-400 border-amber-500/30 bg-amber-950/20",
  COMPLETED: "text-broker-muted border-broker-border/40 bg-broker-surface/20",
  CANCELLED: "text-red-400 border-red-500/30 bg-red-950/20",
  DISPUTED: "text-orange-400 border-orange-500/30 bg-orange-950/20",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka", ASSIGNED: "Dikerjakan", DELIVERED: "Menunggu konfirmasi",
  COMPLETED: "Selesai", CANCELLED: "Dibatalkan", DISPUTED: "Sengketa",
};

function fmtIdr(v: string | number) {
  return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export default async function PenawaranPage() {
  // Lazy expire
  await prisma.jobOffer.updateMany({
    where: { status: "OPEN", expiresAt: { lt: new Date() } },
    data: { status: "CANCELLED" },
  });

  const jobs = await prisma.jobOffer.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      requester: { select: { id: true, name: true, memberSlug: true } },
      _count: { select: { bids: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Penawaran Pekerjaan</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Pesan EA atau indikator dari sesama member. Budget dikunci saat posting — aman via escrow.
          </p>
        </div>
        <Link
          href="/penawaran/buat"
          className="rounded-xl bg-broker-accent px-5 py-2.5 text-sm font-semibold text-broker-bg hover:opacity-90 transition"
        >
          + Buat Penawaran
        </Link>
      </div>

      {/* Info box */}
      <div className="mt-5 rounded-xl border border-broker-border/40 bg-broker-surface/20 px-4 py-3 text-xs text-broker-muted space-y-1">
        <p>
          <strong className="text-white">Cara kerja:</strong> Posting pekerjaan dengan budget → freelancer mengajukan tawaran → Anda pilih pemenang →
          pemenang kirim file → konfirmasi atau tunggu 3 hari (auto-release) → dana diterima pemenang.
        </p>
        <p>Budget Anda dikunci dari wallet saat posting. Jika 30 hari tidak ada pemenang, dana otomatis dikembalikan.</p>
      </div>

      {/* Job list */}
      <div className="mt-6 space-y-3">
        {jobs.length === 0 && (
          <div className="rounded-xl border border-broker-border/40 bg-broker-surface/20 px-6 py-10 text-center text-sm text-broker-muted">
            Belum ada penawaran pekerjaan. Jadilah yang pertama!
          </div>
        )}
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/penawaran/${job.id}`}
            className="group block rounded-xl border border-broker-border bg-broker-surface/30 px-5 py-4 transition hover:border-broker-accent/40 hover:bg-broker-surface/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[job.status] ?? ""}`}>
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
                  <span className="rounded-full border border-broker-border/40 bg-broker-bg/30 px-2 py-0.5 text-[10px] text-broker-muted">
                    {CATEGORY_LABEL[job.category] ?? job.category}
                  </span>
                </div>
                <h2 className="mt-1.5 text-sm font-semibold text-white group-hover:text-broker-accent transition-colors line-clamp-2">
                  {job.title}
                </h2>
                <p className="mt-1 text-xs text-broker-muted">
                  Oleh{" "}
                  <span className="text-white/70">{job.requester.name ?? "Member"}</span>
                  {" · "}
                  {formatJakarta(job.createdAt.toISOString(), { dateStyle: "medium" })}
                  {" · "}
                  Tutup {formatJakarta(job.expiresAt.toISOString(), { dateStyle: "medium" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-broker-gold">Rp {fmtIdr(job.budgetIdr)}</p>
                <p className="text-[10px] text-broker-muted uppercase tracking-wide">maks. budget</p>
                <p className="text-xs text-broker-muted">{job._count.bids} pelamar</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
