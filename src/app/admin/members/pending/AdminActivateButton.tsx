"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminActivateButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function activate() {
    if (!confirm(`Aktifkan akun "${memberName}" tanpa verifikasi OTP?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/members/${memberId}/activate`, { method: "POST" });
    setBusy(false);
    if (res.ok) { setDone(true); router.refresh(); }
    else alert("Gagal mengaktifkan akun");
  }

  if (done) return <span className="text-xs font-semibold text-emerald-600">✓ Diaktifkan</span>;

  return (
    <button
      onClick={activate}
      disabled={busy}
      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-400 disabled:opacity-50 transition"
    >
      {busy ? "…" : "Aktifkan Manual"}
    </button>
  );
}
