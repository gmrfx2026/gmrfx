"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildProfilMailListHref } from "@/lib/adminListParams";

type MailRow = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  fromUser: { name: string | null; email: string | null };
};

export function ProfilMailBox({
  inbox,
  listMeta,
}: {
  inbox: MailRow[];
  listMeta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    q: string;
  };
}) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");

  const { total, page, pageSize, totalPages, q } = listMeta;
  const pagerBase = { perPage: pageSize, q };
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error ?? "Gagal mengirim");
      return;
    }
    setTo("");
    setSubject("");
    setBody("");
    setMsg("Surat terkirim.");
    router.refresh();
  }

  const input =
    "mt-1 w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white";

  return (
    <section className="mt-12 border-t border-broker-border pt-10">
      <h2 className="text-lg font-semibold text-white">Kotak surat</h2>
      <p className="mt-1 text-xs text-broker-muted">
        Kirim ke email, nama, nomor HP, wallet, atau ketik <strong>admin</strong> untuk admin.
      </p>
      <form onSubmit={send} className="mt-4 max-w-xl space-y-3">
        <div>
          <label className="text-xs text-broker-muted">Kepada (email / nama / HP / wallet / admin)</label>
          <input className={input} value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Subjek</label>
          <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-broker-muted">Isi</label>
          <textarea className={input} rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <button type="submit" className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg">
          Kirim surat
        </button>
        {msg && <p className="text-sm text-broker-muted">{msg}</p>}
      </form>

      <h3 className="mt-10 text-sm font-medium text-white">Masuk</h3>

      <form
        action="/profil"
        method="get"
        className="mt-3 flex flex-col gap-3 rounded-xl border border-broker-border bg-broker-surface/30 p-4 md:flex-row md:flex-wrap md:items-end"
      >
        <input type="hidden" name="tab" value="mail" />
        <div className="min-w-[200px] flex-[2]">
          <label className="block text-xs text-broker-muted">Cari surat</label>
          <input
            type="search"
            name="mQ"
            defaultValue={q}
            placeholder="Subjek, isi, pengirim…"
            className={input}
            maxLength={120}
          />
        </div>
        <div className="min-w-[100px]">
          <label className="block text-xs text-broker-muted">Per halaman</label>
          <select
            name="mPerPage"
            defaultValue={String(pageSize)}
            className={input}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg hover:opacity-90"
          >
            Terapkan
          </button>
          <Link
            href={buildProfilMailListHref({})}
            className="rounded-lg border border-broker-border px-4 py-2 text-sm text-broker-muted hover:bg-broker-surface/50"
          >
            Reset
          </Link>
        </div>
      </form>

      <p className="mt-3 text-xs text-broker-muted">
        {total === 0 ? (
          q ? (
            <>Tidak ada surat yang cocok dengan pencarian.</>
          ) : (
            <>Belum ada surat masuk.</>
          )
        ) : (
          <>
            Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari{" "}
            {total.toLocaleString("id-ID")} surat
            {totalPages > 1 ? ` · Halaman ${page} / ${totalPages}` : ""}
          </>
        )}
      </p>

      <ul className="mt-3 space-y-2 text-sm">
        {inbox.map((m) => (
          <li key={m.id} className="rounded-lg border border-broker-border p-3">
            <p className="text-broker-accent">{m.subject}</p>
            <p className="text-xs text-broker-muted">
              Dari: {m.fromUser.name ?? m.fromUser.email} ·{" "}
              {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                new Date(m.createdAt)
              )}
            </p>
            <p className="mt-2 text-broker-muted">{m.body}</p>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Pagination surat">
          <Link
            href={buildProfilMailListHref({ ...pagerBase, page: prev })}
            className={`rounded-lg border border-broker-border px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "text-broker-muted hover:bg-broker-surface/50"
            }`}
          >
            Sebelumnya
          </Link>
          <Link
            href={buildProfilMailListHref({ ...pagerBase, page: next })}
            className={`rounded-lg border border-broker-border px-3 py-1.5 ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "text-broker-muted hover:bg-broker-surface/50"
            }`}
          >
            Berikutnya
          </Link>
        </nav>
      )}
    </section>
  );
}
