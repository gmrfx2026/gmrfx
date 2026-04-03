"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  jobId: string;
  status: string;
  budgetIdr: string;
  requesterName: string;
  winnerName: string | null;
  currentNote: string;
};

const ACTION_LABELS: Record<string, string> = {
  release: "Cairkan ke Pemenang",
  refund: "Kembalikan ke Pemberi Kerja",
  force_cancel: "Paksa Batalkan",
  note: "Simpan Catatan",
};

function fmtIdr(v: string) {
  return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function AdminJobResolvePanel({ jobId, status, budgetIdr, requesterName, winnerName, currentNote }: Props) {
  const router = useRouter();
  const [note, setNote] = useState(currentNote);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const canRelease = winnerName && ["DISPUTED", "DELIVERED", "ASSIGNED"].includes(status);
  const canRefund = ["DISPUTED", "ASSIGNED", "DELIVERED"].includes(status);
  const canForceCancel = ["OPEN", "ASSIGNED"].includes(status);
  const isSettled = ["COMPLETED", "CANCELLED"].includes(status);

  async function runAction(action: string) {
    const label = ACTION_LABELS[action] ?? action;
    const confirmMsg =
      action === "release"
        ? `Cairkan Rp ${fmtIdr(budgetIdr)} ke pemenang "${winnerName}"? Tindakan ini tidak dapat dibatalkan.`
        : action === "refund" || action === "force_cancel"
        ? `Kembalikan Rp ${fmtIdr(budgetIdr)} ke pemberi kerja "${requesterName}"? Pekerjaan akan dibatalkan.`
        : `${label}?`;

    if (!confirm(confirmMsg)) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/admin/job-offers/${jobId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok) { setMsg(`Error: ${j.error ?? "Gagal"}`); }
      else { setMsg(`✓ ${label} berhasil`); router.refresh(); }
    } catch {
      setMsg("Jaringan error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Aksi Admin</h2>

      {isSettled && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-400 text-center">
          Pekerjaan sudah <strong>{status === "COMPLETED" ? "selesai" : "dibatalkan"}</strong> — tidak ada aksi yang tersedia.
        </div>
      )}

      {/* DISPUTED — aksi utama */}
      {status === "DISPUTED" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 space-y-2">
          <p className="text-xs font-semibold text-orange-700 mb-1">⚠ Pekerjaan dalam sengketa — pilih keputusan:</p>
          <button
            disabled={busy || !canRelease}
            onClick={() => void runAction("release")}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-emerald-500 transition"
          >
            ✓ Cairkan ke Pemenang — Rp {fmtIdr(budgetIdr)}
          </button>
          <button
            disabled={busy}
            onClick={() => void runAction("refund")}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-red-500 transition"
          >
            ↩ Kembalikan ke Pemberi Kerja
          </button>
        </div>
      )}

      {/* DELIVERED — admin bisa override konfirmasi */}
      {status === "DELIVERED" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Menunggu konfirmasi pemberi kerja atau auto-release. Admin bisa override:</p>
          <button
            disabled={busy || !canRelease}
            onClick={() => void runAction("release")}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-emerald-500 transition"
          >
            ✓ Paksa Cairkan ke Pemenang
          </button>
          <button
            disabled={busy}
            onClick={() => void runAction("refund")}
            className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40 hover:bg-red-100 transition"
          >
            ↩ Batalkan & Kembalikan Dana
          </button>
        </div>
      )}

      {/* ASSIGNED */}
      {status === "ASSIGNED" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Pemenang sedang mengerjakan. Admin bisa intervensi jika bermasalah:</p>
          {canRelease && (
            <button
              disabled={busy}
              onClick={() => void runAction("release")}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-emerald-500 transition"
            >
              ✓ Cairkan Dana ke Pemenang
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => void runAction("force_cancel")}
            className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40 hover:bg-red-100 transition"
          >
            ✕ Paksa Batalkan & Refund
          </button>
        </div>
      )}

      {/* OPEN */}
      {status === "OPEN" && canForceCancel && (
        <div>
          <p className="mb-2 text-xs text-gray-500">Pekerjaan masih terbuka. Admin bisa batalkan dan refund:</p>
          <button
            disabled={busy}
            onClick={() => void runAction("force_cancel")}
            className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40 hover:bg-red-100 transition"
          >
            ✕ Batalkan & Kembalikan Dana
          </button>
        </div>
      )}

      {/* Catatan admin — tersedia di semua status */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <label className="block text-xs font-semibold text-gray-600">
          Catatan Admin <span className="font-normal text-gray-400">(terlihat oleh kedua pihak)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="mis. Sudah diperiksa — hasil kerja valid, dana dicairkan ke pemenang"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:border-indigo-300 focus:outline-none resize-none"
        />
        <button
          disabled={busy || !note.trim()}
          onClick={() => void runAction("note")}
          className="w-full rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-40 hover:bg-indigo-100 transition"
        >
          Simpan Catatan
        </button>
      </div>

      {msg && (
        <p className={`text-sm font-medium ${msg.startsWith("✓") ? "text-emerald-600" : "text-red-600"}`}>{msg}</p>
      )}
    </div>
  );
}
