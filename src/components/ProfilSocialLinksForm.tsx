"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white placeholder:text-broker-muted/50";

export function ProfilSocialLinksForm({
  initialTiktok,
  initialInstagram,
  initialFacebook,
  initialTelegram,
}: {
  initialTiktok: string;
  initialInstagram: string;
  initialFacebook: string;
  initialTelegram: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [tiktok, setTiktok] = useState(initialTiktok);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [facebook, setFacebook] = useState(initialFacebook);
  const [telegram, setTelegram] = useState(initialTelegram);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile/social-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialTiktokUrl: tiktok,
          socialInstagramUrl: instagram,
          socialFacebookUrl: facebook,
          socialTelegramUrl: telegram,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(typeof j.error === "string" ? j.error : "Gagal menyimpan.", "err");
        return;
      }
      show("Tautan sosial disimpan.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-broker-border bg-broker-surface/40 p-4">
      <h2 className="text-lg font-semibold text-white">Tautan sosial (profil publik)</h2>
      <p className="mt-1 text-sm text-broker-muted">
        Isi hanya yang ingin ditampilkan di halaman profil Anda sebagai ikon. Kosongkan untuk menyembunyikan.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm text-broker-muted">
          <span className="font-medium text-white/90">TikTok</span>
          <input
            type="url"
            name="socialTiktokUrl"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://www.tiktok.com/@..."
            className={inputClass}
            disabled={saving}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm text-broker-muted">
          <span className="font-medium text-white/90">Instagram</span>
          <input
            type="url"
            name="socialInstagramUrl"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/..."
            className={inputClass}
            disabled={saving}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm text-broker-muted">
          <span className="font-medium text-white/90">Facebook</span>
          <input
            type="url"
            name="socialFacebookUrl"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/..."
            className={inputClass}
            disabled={saving}
            autoComplete="off"
          />
        </label>
        <label className="block text-sm text-broker-muted">
          <span className="font-medium text-white/90">Telegram</span>
          <input
            type="url"
            name="socialTelegramUrl"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="https://t.me/..."
            className={inputClass}
            disabled={saving}
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : "Simpan tautan"}
        </button>
      </form>
    </div>
  );
}
