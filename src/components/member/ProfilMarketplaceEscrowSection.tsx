"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export type MarketplaceEscrowStatusUi = "PENDING" | "DISPUTED" | "RELEASED" | "REFUNDED";
export type MarketplaceEscrowProductTypeUi = "INDICATOR" | "EA";

export type ProfilEscrowRow = {
  id: string;
  role: "buyer" | "seller";
  status: MarketplaceEscrowStatusUi;
  productType: MarketplaceEscrowProductTypeUi;
  amountIdr: number;
  releaseAt: string;
  createdAt: string;
  title: string | null;
  slug: string | null;
  productPath: string | null;
  disputeReason: string | null;
  counterpartyLabel: string;
};

const statusLabel: Record<MarketplaceEscrowStatusUi, string> = {
  PENDING: "Ditahan (escrow)",
  DISPUTED: "Komplain / ditinjau admin",
  RELEASED: "Dana sudah cair ke penjual",
  REFUNDED: "Dana dikembalikan ke pembeli",
};

const typeLabel: Record<MarketplaceEscrowProductTypeUi, string> = {
  INDICATOR: "Indikator",
  EA: "Expert Advisor",
};

function formatIdr(n: number) {
  return n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProfilMarketplaceEscrowSection({ rows }: { rows: ProfilEscrowRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (rows.length === 0) return null;

  async function post(url: string, body?: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error || "Permintaan gagal");
  }

  async function onConfirm(holdId: string) {
    if (!window.confirm("Konfirmasi: barang sudah sesuai dan Anda setuju melepas dana ke penjual?")) return;
    setBusyId(holdId);
    setMsg(null);
    try {
      await post(`/api/member/marketplace-escrow/${holdId}/confirm`);
      setMsg("Konfirmasi berhasil. Dana penjual telah ditambahkan ke saldo mereka.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusyId(null);
    }
  }

  async function onDispute(holdId: string) {
    const reason = window.prompt(
      "Jelaskan masalah (minimal 10 karakter). Admin akan meninjau sebelum keputusan refund atau pencairan."
    );
    if (reason == null) return;
    setBusyId(holdId);
    setMsg(null);
    try {
      await post(`/api/member/marketplace-escrow/${holdId}/dispute`, { reason });
      setMsg("Komplain diajukan. Dana tetap ditahan sampai keputusan admin.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-broker-border bg-broker-surface/30 p-4">
      <h2 className="text-lg font-semibold text-white">Pembelian marketplace (escrow)</h2>
      <p className="mt-1 text-sm text-broker-muted">
        Dana berbayar untuk indikator/EA ditahan hingga masa komplain selesai atau Anda mengonfirmasi terima barang.
        Mirip mekanisme marketplace: jika ada masalah, ajukan komplain sebelum dana dicairkan otomatis.
      </p>
      {msg && (
        <p className="mt-3 rounded border border-broker-accent/40 bg-broker-accent/10 px-3 py-2 text-sm text-white">
          {msg}
        </p>
      )}
      <ul className="mt-4 space-y-4">
        {rows.map((r) => {
          const busy = busyId === r.id;
          const showBuyerActions = r.role === "buyer" && r.status === "PENDING";
          return (
            <li
              key={r.id}
              className="rounded-lg border border-broker-border/80 bg-broker-bg/40 p-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-white">
                  {r.title ?? "Produk"}
                  {r.productPath && r.slug ? (
                    <Link
                      href={r.productPath}
                      className="ml-2 text-broker-accent hover:underline"
                    >
                      Lihat
                    </Link>
                  ) : null}
                </span>
                <span className="text-broker-gold">Rp {formatIdr(r.amountIdr)}</span>
              </div>
              <p className="mt-1 text-broker-muted">
                {typeLabel[r.productType]} · Anda sebagai{" "}
                <strong className="text-white">{r.role === "buyer" ? "pembeli" : "penjual"}</strong> · lawan:{" "}
                {r.counterpartyLabel}
              </p>
              <p className="mt-1 text-broker-muted">
                Status: <strong className="text-white">{statusLabel[r.status]}</strong>
              </p>
              <p className="mt-0.5 text-xs text-broker-muted">
                Pencairan otomatis ke penjual paling lambat:{" "}
                {new Date(r.releaseAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              {r.disputeReason && r.status === "DISPUTED" ? (
                <p className="mt-2 rounded bg-black/20 px-2 py-1 text-xs text-broker-muted">
                  Alasan komplain: {r.disputeReason}
                </p>
              ) : null}
              {showBuyerActions ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onConfirm(r.id)}
                    className="rounded bg-broker-accent px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                  >
                    Konfirmasi terima — cairkan ke penjual
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDispute(r.id)}
                    className="rounded border border-amber-600/60 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/20 disabled:opacity-50"
                  >
                    Ajukan komplain
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
