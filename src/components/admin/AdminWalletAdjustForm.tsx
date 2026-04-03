"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = {
  id: string;
  name: string | null;
  email: string;
  walletBalance: { toString(): string };
};

export function AdminWalletAdjustForm({
  members,
  initialQ,
}: {
  members: Member[];
  initialQ: string;
}) {
  const router   = useRouter();
  const [q, setQ]               = useState(initialQ);
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount]     = useState("");
  const [note, setNote]         = useState("");
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState("");

  const selected = members.find((m) => m.id === selectedId);
  const amtNum   = parseFloat(amount.replace(/,/g, ".")) || 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/admin/wallet-adjust?q=${encodeURIComponent(q)}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || amtNum === 0) return;

    const action   = amtNum > 0 ? "KREDIT" : "DEBIT";
    const absAmt   = Math.abs(amtNum);
    if (
      !confirm(
        `${action} Rp ${absAmt.toLocaleString("id-ID")} ke/dari ${selected?.name ?? selected?.email}?\n\nCatatan: ${note || "(kosong)"}`
      )
    )
      return;

    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/wallet-adjust", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: selectedId, amount: amtNum, note }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        error?: string;
        newBalance?: number;
        txId?: string;
      };
      if (!r.ok) {
        setMsg(`Error: ${j.error ?? "Gagal"}`);
      } else {
        setMsg(
          `✓ Berhasil. Saldo baru: Rp ${(j.newBalance ?? 0).toLocaleString("id-ID", {
            maximumFractionDigits: 2,
          })} | TX: ${j.txId ?? ""}`
        );
        setAmount("");
        setNote("");
        setSelectedId("");
        router.refresh();
      }
    } catch {
      setMsg("Jaringan error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Langkah 1: cari member */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari member (nama atau email)…"
          maxLength={80}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Cari
        </button>
      </form>

      {/* Langkah 2: pilih member dari hasil */}
      {members.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Pilih member:</p>
          <div className="max-h-48 overflow-y-auto rounded border border-gray-200 divide-y divide-gray-100">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 ${
                  selectedId === m.id ? "bg-green-50 font-semibold text-green-800" : "text-gray-800"
                }`}
              >
                <span className="font-medium">{m.name ?? "—"}</span>
                <span className="ml-2 text-xs text-gray-500">{m.email}</span>
                <span className="ml-2 text-xs text-gray-400">
                  Saldo: Rp{" "}
                  {Number(m.walletBalance.toString()).toLocaleString("id-ID", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Langkah 3: isi form penyesuaian */}
      {selectedId && selected && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Member dipilih: <strong>{selected.name ?? selected.email}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Saldo saat ini: Rp{" "}
              {Number(selected.walletBalance.toString()).toLocaleString("id-ID", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <label className="block text-sm">
            <span className="text-gray-600">
              Jumlah IDR{" "}
              <span className="text-xs text-gray-400">
                (positif = kredit/tambah, negatif = debit/kurangi)
              </span>
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="mis. 50000 atau -25000"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            {amtNum !== 0 && (
              <span
                className={`mt-1 block text-xs font-semibold ${
                  amtNum > 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                {amtNum > 0 ? "▲ Kredit" : "▼ Debit"} Rp{" "}
                {Math.abs(amtNum).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                {" → Saldo baru ≈ Rp "}
                {(
                  Number(selected.walletBalance.toString()) + amtNum
                ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              </span>
            )}
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Catatan / alasan (wajib)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              required
              placeholder="mis. Kompensasi deposit USDT gagal TX 0x123…"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          {msg && (
            <p
              className={`rounded px-3 py-2 text-sm ${
                msg.startsWith("✓")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {msg}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !amtNum || !note.trim()}
              className={`rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition ${
                amtNum < 0
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-700 hover:bg-green-800"
              }`}
            >
              {busy ? "Memproses…" : amtNum < 0 ? "Debit Saldo" : "Kredit Saldo"}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedId(""); setAmount(""); setNote(""); setMsg(""); }}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
