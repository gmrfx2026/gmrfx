"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfilAvatarUpload() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = raw ? (JSON.parse(raw) as { error?: string }) : {};
    } catch {
      setMsg(`Upload gagal (HTTP ${res.status}).`);
      return;
    }
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : `Upload gagal (HTTP ${res.status}).`);
      return;
    }
    setMsg("Foto diperbarui.");
    router.refresh();
  }

  return (
    <div className="mt-3 text-center">
      <label className="cursor-pointer text-xs text-broker-accent hover:underline">
        Ganti foto
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
      </label>
      {msg && (
        <p
          className={
            msg === "Foto diperbarui."
              ? "mt-1 text-xs text-broker-accent"
              : "mt-1 text-xs text-red-400"
          }
        >
          {msg}
        </p>
      )}
    </div>
  );
}
