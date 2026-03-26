"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type C = { id: string; content: string; createdAt: string; author: string };

export function ProfilStatusBlock({
  initialStatus,
  ownerSlug,
  comments,
}: {
  initialStatus: string;
  ownerSlug: string;
  comments: C[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  async function saveStatus(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileStatus: status }),
    });
    setSaving(false);
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white";

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Status profil</h2>
      <p className="mt-1 text-xs text-broker-muted">
        Bagikan tautan publik agar member lain bisa berkomentar:{" "}
        <Link href={`/${ownerSlug}`} className="break-all text-broker-accent hover:underline">
          /{ownerSlug}
        </Link>
      </p>
      <form onSubmit={saveStatus} className="mt-3 space-y-2">
        <textarea
          className={input}
          rows={3}
          maxLength={500}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Status singkat di profil Anda…"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-broker-border px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Menyimpan…" : "Simpan status"}
        </button>
      </form>

      <h3 className="mt-8 text-sm font-medium text-broker-muted">Komentar dari member lain</h3>
      <ul className="mt-3 space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-broker-border bg-broker-surface/30 p-3 text-sm">
            <p className="text-broker-accent">{c.author}</p>
            <p className="text-broker-muted">{c.content}</p>
            <p className="mt-1 text-xs text-broker-muted/60">
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                new Date(c.createdAt)
              )}
            </p>
          </li>
        ))}
      </ul>
      {comments.length === 0 && (
        <p className="mt-2 text-sm text-broker-muted">Belum ada komentar.</p>
      )}
    </div>
  );
}
