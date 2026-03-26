"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfilWalletTransfer() {
  const router = useRouter();
  const [toWallet, setToWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const res = await fetch("/api/wallet/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toWallet, amount: Number(amount), note }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Transfer gagal");
      return;
    }
    setMsg(`Berhasil. ID transaksi: ${data.transactionId}`);
    setToWallet("");
    setAmount("");
    setNote("");
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white";

  return (
    <section className="mt-10 border-t border-broker-border pt-10">
      <h2 className="text-lg font-semibold text-white">Transfer saldo antar member</h2>
      <p className="mt-1 text-xs text-broker-muted">
        Masukkan alamat wallet penerima (2 huruf + 5 angka). Fee marketplace untuk jual beli indikator akan
        ditambahkan lewat pengaturan sistem.
      </p>
      <form onSubmit={onSubmit} className="mt-4 max-w-md space-y-3">
        <div>
          <label className="text-xs text-broker-muted">Alamat wallet penerima</label>
          <input
            className={input}
            value={toWallet}
            onChange={(e) => setToWallet(e.target.value)}
            placeholder="AB12345"
            required
          />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Jumlah (IDR)</label>
          <input
            className={input}
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Catatan (opsional)</label>
          <input className={input} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
        >
          {loading ? "Memproses…" : "Kirim"}
        </button>
        {msg && <p className="text-sm text-broker-muted">{msg}</p>}
      </form>
    </section>
  );
}
