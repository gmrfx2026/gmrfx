"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type WithdrawReq = {
  id: string;
  amountIdr: number;
  method: string;
  status: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  usdtAddress: string | null;
  adminNote: string | null;
  user: { name: string | null; email: string; walletBalance: number };
};

const ACTION_LABEL: Record<string, string> = {
  processing: "Tandai Diproses",
  approve: "Setujui",
  reject: "Tolak",
};
const ACTION_COLOR: Record<string, string> = {
  processing: "bg-blue-600 hover:bg-blue-500",
  approve: "bg-emerald-600 hover:bg-emerald-500",
  reject: "bg-red-600 hover:bg-red-500",
};

function fmtIDR(n: number) { return "Rp " + Number(n).toLocaleString("id-ID"); }

export function WithdrawActionPanel({ req }: { req: WithdrawReq }) {
  const router = useRouter();
  const [note, setNote] = useState(req.adminNote ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const canProcess = req.status === "PENDING";
  const canApprove = req.status === "PENDING" || req.status === "PROCESSING";
  const canReject = req.status === "PENDING" || req.status === "PROCESSING";

  const actions: Array<{ key: string; enabled: boolean }> = [
    { key: "processing", enabled: canProcess },
    { key: "approve", enabled: canApprove },
    { key: "reject", enabled: canReject },
  ];

  async function doAction(action: string) {
    if (action === "reject" && !confirm("Tolak pengajuan ini? Saldo akan dikembalikan ke member.")) return;
    if (action === "approve" && !confirm("Setujui pengajuan ini? Pastikan dana sudah ditransfer ke member.")) return;
    setErr("");
    setBusy(action);
    const res = await fetch(`/api/admin/withdrawals/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: note || undefined }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
    else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Gagal");
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Catatan admin (opsional: nomor referensi transfer, alasan tolak, dll.)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <div className="flex flex-wrap gap-2">
        {actions.map(({ key, enabled }) => (
          <button
            key={key}
            onClick={() => doAction(key)}
            disabled={!enabled || busy !== null}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 ${ACTION_COLOR[key]}`}
          >
            {busy === key ? "…" : ACTION_LABEL[key]}
          </button>
        ))}
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}

export function WithdrawTable({ requests }: { requests: WithdrawReq[] }) {
  const STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-600",
  };
  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Menunggu", PROCESSING: "Diproses", APPROVED: "Selesai", REJECTED: "Ditolak",
  };

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold text-gray-900">{fmtIDR(req.amountIdr)}</p>
              <p className="text-xs text-gray-500">
                {req.user.name ?? req.user.email} — saldo saat ini: {fmtIDR(req.user.walletBalance)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {req.method === "BANK"
                  ? `🏦 ${req.bankName} · ${req.bankAccountNumber} · ${req.bankAccountHolder}`
                  : `💎 USDT (BSC) · ${req.usdtAddress}`}
              </p>
              {req.adminNote && (
                <p className="mt-1 text-xs text-gray-400 italic">{req.adminNote}</p>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[req.status] ?? ""}`}>
              {STATUS_LABEL[req.status] ?? req.status}
            </span>
          </div>
          {(req.status === "PENDING" || req.status === "PROCESSING") && (
            <WithdrawActionPanel req={req} />
          )}
        </div>
      ))}
    </div>
  );
}
