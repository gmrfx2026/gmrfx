"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMtLicenseRevokeButton({
  licenseId,
  disabled,
}: {
  licenseId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function revoke() {
    if (
      !globalThis.confirm(
        "Cabut lisensi ini? Key tidak akan lagi lolos verifikasi di MetaTrader (tidak dapat di-undo dari tombol ini)."
      )
    ) {
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/mt-licenses/${licenseId}/revoke`, { method: "POST" });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal mencabut");
        return;
      }
      router.refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void revoke()}
        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "…" : "Cabut lisensi"}
      </button>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}
