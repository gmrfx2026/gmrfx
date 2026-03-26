"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export function ProfilFollowSettings({
  initialMode,
}: {
  initialMode: "AUTO" | "APPROVAL_REQUIRED";
}) {
  const router = useRouter();
  const { show } = useToast();
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);

  async function save(next: "AUTO" | "APPROVAL_REQUIRED") {
    if (next === mode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/follow-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followApprovalMode: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        show(typeof j.error === "string" ? j.error : "Gagal menyimpan.", "err");
        return;
      }
      setMode(next);
      show("Pengaturan disimpan.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-broker-border bg-broker-surface/40 p-4">
      <h2 className="text-lg font-semibold text-white">Privasi mengikuti</h2>
      <p className="mt-1 text-sm text-broker-muted">
        Atur apakah orang bisa langsung mengikuti Anda, atau harus menunggu persetujuan Anda (seperti akun
        privat).
      </p>
      <fieldset disabled={saving} className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-broker-border/60 bg-broker-bg/40 p-3">
          <input
            type="radio"
            name="followMode"
            checked={mode === "AUTO"}
            onChange={() => void save("AUTO")}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-white">Langsung aktif</span>
            <span className="mt-0.5 block text-sm text-broker-muted">
              Siapa pun yang memilih mengikuti langsung menjadi pengikut tanpa persetujuan Anda.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-broker-border/60 bg-broker-bg/40 p-3">
          <input
            type="radio"
            name="followMode"
            checked={mode === "APPROVAL_REQUIRED"}
            onChange={() => void save("APPROVAL_REQUIRED")}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-white">Perlu persetujuan</span>
            <span className="mt-0.5 block text-sm text-broker-muted">
              Anda menerima permintaan mengikuti; setujui atau tolak di menu Notifikasi.
            </span>
          </span>
        </label>
      </fieldset>
    </div>
  );
}
