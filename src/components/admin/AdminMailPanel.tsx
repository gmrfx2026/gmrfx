"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type In = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  fromLabel: string;
};

type M = { id: string; email: string; name: string | null };

export function AdminMailPanel({
  inbox,
  members,
  inboxFooter,
}: {
  inbox: In[];
  members: M[];
  /** Pagination / slot server (boleh di-pass dari halaman server). */
  inboxFooter?: React.ReactNode;
}) {
  const router = useRouter();
  const [to, setTo] = useState(members[0]?.email ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(data.error ?? (res.ok ? "Terkirim" : "Gagal"));
    if (res.ok) {
      setSubject("");
      setBody("");
      router.refresh();
    }
  }

  const inp = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="font-semibold text-gray-800">Kotak masuk admin</h2>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {inbox.map((m) => (
            <li key={m.id} className="rounded border border-gray-200 bg-white p-3">
              <p className="font-medium text-gray-800">{m.subject}</p>
              <p className="text-xs text-gray-500">Dari: {m.fromLabel}</p>
              <p className="mt-1 text-gray-600">{m.body}</p>
            </li>
          ))}
        </ul>
        {inbox.length === 0 && <p className="text-sm text-gray-500">Kosong.</p>}
        {inboxFooter}
      </div>
      <form onSubmit={send} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800">Kirim ke member</h2>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Penerima (email)</span>
          <select className={inp} value={to} onChange={(e) => setTo(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.email}>
                {m.name ?? m.email}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Subjek</span>
          <input className={inp} value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Isi</span>
          <textarea className={inp} rows={5} value={body} onChange={(e) => setBody(e.target.value)} required />
        </label>
        <button type="submit" className="mt-4 rounded bg-green-600 px-4 py-2 text-sm text-white">
          Kirim
        </button>
        {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  );
}
