"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMarketplaceEscrowActions({
  holdId,
  status,
}: {
  holdId: string;
  status: "PENDING" | "DISPUTED" | "RELEASED" | "REFUNDED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canAct = status === "PENDING" || status === "DISPUTED";
  if (!canAct) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  async function release() {
    if (!window.confirm("Cairkan dana ke saldo penjual?")) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/marketplace-escrow/${holdId}/release`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  async function refund() {
    const note = window.prompt("Catatan admin untuk refund (opsional):") ?? "";
    if (note === null) return;
    if (!window.confirm("Kembalikan dana ke pembeli dan cabut hak unduh?")) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/marketplace-escrow/${holdId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void release()}
          className="rounded bg-green-600 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          Cairkan penjual
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void refund()}
          className="rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          Refund pembeli
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
