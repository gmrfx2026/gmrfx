"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDepositCreditButton({
  depositId,
  amountUsdt,
  currentRateIdr,
  memberName,
}: {
  depositId: string;
  amountUsdt: number;
  currentRateIdr: number;
  memberName: string;
}) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [rate, setRate]     = useState(String(currentRateIdr || 16000));
  const [note, setNote]     = useState("");
  const [busy, setBusy]     = useState(false);
  const [msg,  setMsg]      = useState("");

  const preview = amountUsdt * (parseFloat(rate) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Kredit manual Rp ${preview.toLocaleString("id-ID", { maximumFractionDigits: 0 })} ke ${memberName}?`)) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/admin/deposits/${depositId}/credit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rateIdr: parseFloat(rate), note }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string; amountIdr?: number };
      if (!r.ok) {
        setMsg(`Error: ${j.error ?? "Gagal"}`);
      } else {
        setMsg(`✓ Dikreditkan Rp ${(j.amountIdr ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`);
        setOpen(false);
        router.refresh();
      }
    } catch {
      setMsg("Jaringan error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
      >
        Proses Manual
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-800">Proses Deposit Manual</h2>
            <p className="mt-1 text-sm text-gray-600">
              Member: <strong>{memberName}</strong> · {amountUsdt} USDT
            </p>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600">Kurs USDT/IDR (override)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  IDR dikreditkan:{" "}
                  <strong>
                    Rp {preview.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                  </strong>
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Catatan admin (opsional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  placeholder="mis. BSCScan sempat down, TX valid"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              {msg && (
                <p className={`text-sm ${msg.startsWith("✓") ? "text-green-700" : "text-red-600"}`}>
                  {msg}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy || !parseFloat(rate)}
                  className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {busy ? "Memproses…" : "Kredit Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
