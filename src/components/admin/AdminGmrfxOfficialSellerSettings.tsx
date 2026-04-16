"use client";

import { useCallback, useState } from "react";

type Preview = {
  id: string;
  email: string;
  name: string | null;
  hasWallet: boolean;
} | null;

type Initial = {
  envUserId: string | null;
  databaseUserId: string | null;
  effectiveUserId: string | null;
  envOverridesDatabase: boolean;
  preview: Preview;
};

export function AdminGmrfxOfficialSellerSettings({ initial }: { initial: Initial }) {
  const [data, setData] = useState<Initial>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/admin/gmrfx-official-seller");
    const j = (await r.json()) as Initial & { error?: string };
    if (!r.ok) {
      setErr(typeof j.error === "string" ? j.error : "Gagal memuat");
      return;
    }
    setData({
      envUserId: j.envUserId,
      databaseUserId: j.databaseUserId,
      effectiveUserId: j.effectiveUserId,
      envOverridesDatabase: j.envOverridesDatabase,
      preview: j.preview,
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const v = input.trim();
    if (!v) {
      setErr("Isi email atau ID user");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/gmrfx-official-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIdOrEmail: v }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "Gagal menyimpan");
        return;
      }
      setMsg("Tersimpan di database (SystemSetting).");
      setInput("");
      await refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  async function clearDb() {
    if (!globalThis.confirm("Hapus ID penjual dari database? (Env tidak diubah.)")) return;
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/gmrfx-official-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "Gagal");
        return;
      }
      setMsg("Nilai di database dihapus.");
      await refresh();
    } catch {
      setErr("Jaringan error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Akun penjual resmi GMRFX</h2>
      <p className="mt-1 text-sm text-gray-500">
        Pembelian indikator GMRFX mengarah ke user ini (escrow). Prioritas:{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">GMRFX_OFFICIAL_SELLER_USER_ID</code> di env, lalu nilai di
        bawah (SystemSetting).
      </p>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-gray-600">Env aktif:</dt>
          <dd className="font-mono text-xs text-gray-800">
            {data.envUserId ? data.envUserId : <span className="text-gray-400">(kosong)</span>}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-gray-600">Database:</dt>
          <dd className="font-mono text-xs text-gray-800">
            {data.databaseUserId ? data.databaseUserId : <span className="text-gray-400">(kosong)</span>}
          </dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="font-medium text-gray-600">Efektif dipakai:</dt>
          <dd className="font-mono text-xs text-emerald-800">
            {data.effectiveUserId ? data.effectiveUserId : <span className="text-gray-400">(belum)</span>}
          </dd>
        </div>
        {data.envOverridesDatabase ? (
          <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Env <code className="rounded bg-white/60 px-0.5">GMRFX_OFFICIAL_SELLER_USER_ID</code> aktif — ID efektif
            memakai env. Untuk memakai nilai dari database saja, hapus env di server lalu restart.
          </p>
        ) : null}
      </dl>

      {data.preview ? (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">User:</span> {data.preview.name ?? "—"} · {data.preview.email}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Wallet: {data.preview.hasWallet ? "ada (OK untuk berbayar)" : "belum — wajib untuk jual berbayar"}
          </p>
        </div>
      ) : data.effectiveUserId ? (
        <p className="mt-3 text-sm text-red-600">ID efektif tidak cocok user di DB (periksa data).</p>
      ) : (
        <p className="mt-3 text-sm text-amber-800">Belum ada penjual resmi — simpan email atau ID user di bawah.</p>
      )}

      <form onSubmit={(e) => void save(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-gray-500">Email atau user ID (cuid)</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="email@domain.com atau clxxxxxxxx..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "…" : "Simpan ke database"}
        </button>
      </form>

      {data.databaseUserId ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void clearDb()}
          className="mt-3 text-sm text-red-700 underline hover:text-red-900 disabled:opacity-50"
        >
          Hapus nilai dari database
        </button>
      ) : null}

      {msg ? <p className="mt-3 text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
    </div>
  );
}
