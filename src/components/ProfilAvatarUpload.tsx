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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "Upload gagal");
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
      {msg && <p className="mt-1 text-xs text-broker-muted">{msg}</p>}
    </div>
  );
}
