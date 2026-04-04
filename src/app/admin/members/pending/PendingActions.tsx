"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string | null;
  email: string;
  phoneWhatsApp: string | null;
  createdAt: string;
};

function fmtDT(s: string) {
  return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PendingMemberActions({ member }: { member: Member }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function patchStatus(status: "ACTIVE" | "delete") {
    if (!confirm(status === "delete" ? `Hapus akun ${member.email}?` : `Aktifkan akun ${member.email}?`)) return;
    setBusy(true); setMsg("");
    if (status === "delete") {
      const r = await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      setBusy(false);
      if (r.ok) { setMsg("Dihapus"); startTransition(() => router.refresh()); }
      else setMsg(j.error ?? "Gagal");
      return;
    }
    const r = await fetch("/api/admin/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, memberStatus: "ACTIVE" }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg("Diaktifkan ✓"); startTransition(() => router.refresh()); }
    else setMsg(j.error ?? "Gagal");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={busy}
        onClick={() => void patchStatus("ACTIVE")}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 hover:bg-emerald-500 transition"
      >
        Aktifkan
      </button>
      <button
        disabled={busy}
        onClick={() => void patchStatus("delete")}
        className="rounded-lg border border-red-400/40 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-400 disabled:opacity-40 hover:bg-red-950/50 transition"
      >
        Hapus
      </button>
      {msg && <span className="text-xs text-broker-muted">{msg}</span>}
    </div>
  );
}
