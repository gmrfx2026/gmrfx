"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phoneWhatsApp: string | null;
  walletAddress: string | null;
  walletBalance: number;
  memberStatus: string;
  addressLine: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  kodePos: string | null;
  negara: string | null;
  role: string;
};

export function MemberRowActions({ user }: { user: UserRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: user.email,
    name: user.name ?? "",
    phoneWhatsApp: user.phoneWhatsApp ?? "",
    walletAddress: user.walletAddress ?? "",
    walletBalance: String(user.walletBalance),
    memberStatus: user.memberStatus,
    role: user.role,
    password: "",
    addressLine: user.addressLine ?? "",
    kecamatan: user.kecamatan ?? "",
    kabupaten: user.kabupaten ?? "",
    provinsi: user.provinsi ?? "",
    kodePos: user.kodePos ?? "",
    negara: user.negara ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        ...form,
        password: form.password || undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Gagal menyimpan");
    }
  }

  const inp = "mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
      >
        Edit
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h3 className="font-semibold text-gray-800">Edit member</h3>
            <form onSubmit={save} className="mt-4 grid gap-2 text-sm">
              <label className="block">
                <span className="text-gray-600">Email</span>
                <input className={inp} value={form.email} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label className="block">
                <span className="text-gray-600">Nama</span>
                <input className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label className="block">
                <span className="text-gray-600">HP / WhatsApp</span>
                <input
                  className={inp}
                  value={form.phoneWhatsApp}
                  onChange={(e) => set("phoneWhatsApp", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Wallet</span>
                <input
                  className={inp}
                  value={form.walletAddress}
                  onChange={(e) => set("walletAddress", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Saldo IDR</span>
                <input
                  className={inp}
                  value={form.walletBalance}
                  onChange={(e) => set("walletBalance", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-gray-600">Status member</span>
                <select
                  className={inp}
                  value={form.memberStatus}
                  onChange={(e) => set("memberStatus", e.target.value)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </label>
              <label className="block">
                <span className="text-gray-600">Role</span>
                <select className={inp} value={form.role} onChange={(e) => set("role", e.target.value)}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="block">
                <span className="text-gray-600">Password baru (opsional)</span>
                <input
                  className={inp}
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Kosongkan jika tidak diubah"
                />
              </label>
              <p className="text-xs font-medium text-gray-500">Alamat</p>
              <input className={inp} value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} value={form.kecamatan} onChange={(e) => set("kecamatan", e.target.value)} />
                <input className={inp} value={form.kabupaten} onChange={(e) => set("kabupaten", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} value={form.provinsi} onChange={(e) => set("provinsi", e.target.value)} />
                <input className={inp} value={form.kodePos} onChange={(e) => set("kodePos", e.target.value)} />
              </div>
              <input className={inp} value={form.negara} onChange={(e) => set("negara", e.target.value)} />
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
