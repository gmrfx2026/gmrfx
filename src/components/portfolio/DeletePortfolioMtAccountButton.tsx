"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Props = {
  mtLogin: string;
  /** Setelah sukses (default: ringkasan portofolio). */
  redirectHref?: string;
  className?: string;
};

export function DeletePortfolioMtAccountButton({
  mtLogin,
  redirectHref = "/profil/portfolio/summary",
  className = "",
}: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `Hapus akun MT ${mtLogin} dari portofolio Anda?\n\n` +
        "Semua log deal, snapshot, jurnal, trade log, dan data dashboard untuk nomor ini akan dihapus permanen dari situs. " +
        "Jika akun ini dipublikasikan ke komunitas (Copy / Ikuti), publikasi dan pelanggan ke akun ini juga akan dihapus.\n\n" +
        "Tindakan ini tidak bisa dibatalkan."
    );
    if (!ok) return;

    setBusy(true);
    try {
      const r = await fetch("/api/profile/mt-trade-account", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mtLogin }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal menghapus", "err");
        return;
      }
      show("Akun MT dan semua log terkait telah dihapus.");
      router.push(redirectHref);
      router.refresh();
    } catch {
      show("Jaringan error.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onDelete()}
      className={
        className ||
        "text-xs font-medium text-red-400/90 underline decoration-red-400/40 underline-offset-2 hover:text-red-300 disabled:opacity-50"
      }
    >
      {busy ? "Menghapus…" : "Hapus akun & semua log"}
    </button>
  );
}
