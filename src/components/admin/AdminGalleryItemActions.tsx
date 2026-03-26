"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Cat = { id: string; name: string };

type GalleryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  categoryId: string;
  sortOrder: number;
};

export function AdminGalleryItemActions({
  item,
  categories,
}: {
  item: GalleryItem;
  categories: Cat[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoryId: item.categoryId,
    imageUrl: item.imageUrl,
    caption: item.caption ?? "",
    sortOrder: String(item.sortOrder ?? 0),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl,
        caption: form.caption,
        sortOrder: Math.trunc(Number(form.sortOrder)) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Gagal menyimpan");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Hapus item galeri ini?")) return;
    const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Gagal menghapus");
      return;
    }
    router.refresh();
  }

  const inp = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm";

  return (
    <>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={remove}
          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Hapus
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-800">Edit item galeri</h3>
            <form onSubmit={save} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600">Kategori</span>
                <select
                  className={inp}
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">URL gambar</span>
                <input
                  className={inp}
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Keterangan</span>
                <input
                  className={inp}
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                  maxLength={500}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Urutan tampil (sortOrder)</span>
                <input
                  type="number"
                  className={inp}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
                <span className="mt-0.5 block text-xs text-gray-500">Angka lebih kecil tampil lebih dulu di album.</span>
              </label>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700"
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
