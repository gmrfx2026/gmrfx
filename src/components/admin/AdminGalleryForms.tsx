"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Cat = { id: string; name: string; slug: string; imageCount: number };

export function AdminGalleryForms({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catId, setCatId] = useState(categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", name: catName, description: catDesc }),
    });
    if (res.ok) {
      setCatName("");
      setCatDesc("");
      setMsg("Kategori ditambahkan.");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setErr(typeof data.error === "string" ? data.error : "Gagal tambah kategori");
  }

  async function uploadImageFile(): Promise<string | null> {
    if (!imageFile) return null;
    const form = new FormData();
    form.append("file", imageFile);
    const res = await fetch("/api/admin/gallery/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Gagal upload file");
    }
    return typeof data.url === "string" ? data.url : null;
  }

  async function addImage(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setUploading(true);
    try {
      const uploadedUrl = await uploadImageFile();
      const finalUrl = String((uploadedUrl ?? imageUrl) || "").trim();
      if (!catId || !finalUrl) {
        setErr("Kategori dan gambar wajib diisi");
        setUploading(false);
        return;
      }

      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", categoryId: catId, imageUrl: finalUrl, caption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Gagal tambah gambar");
        setUploading(false);
        return;
      }

      setImageFile(null);
      setImageUrl("");
      setCaption("");
      setMsg("Gambar ditambahkan ke galeri.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal tambah gambar");
    } finally {
      setUploading(false);
    }
  }

  const inp = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm";
  const noCategories = categories.length === 0;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <form onSubmit={addCategory} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800">Kategori baru</h2>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Nama</span>
          <input className={inp} value={catName} onChange={(e) => setCatName(e.target.value)} required />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Deskripsi</span>
          <input className={inp} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
        </label>
        <button type="submit" className="mt-4 rounded bg-green-600 px-4 py-2 text-sm text-white">
          Tambah kategori
        </button>
      </form>

      <form onSubmit={addImage} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800">Upload gambar galeri</h2>
        <label className="mt-3 block text-sm">
          <span className="text-gray-600">Kategori</span>
          <select
            className={inp}
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            disabled={noCategories || uploading}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.imageCount})
              </option>
            ))}
          </select>
        </label>
        {noCategories && <p className="mt-2 text-sm text-amber-700">Buat kategori dulu sebelum upload gambar.</p>}

        <label className="mt-2 block text-sm">
          <span className="text-gray-600">File gambar (JPG/PNG/WebP, maks. 2,5 MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={inp}
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            disabled={uploading || noCategories}
          />
        </label>

        <p className="mt-2 text-xs text-gray-500">Opsional: jika tidak upload file, Anda bisa pakai URL langsung.</p>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">URL gambar (opsional)</span>
          <input
            className={inp}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            disabled={uploading || noCategories}
          />
        </label>
        <label className="mt-2 block text-sm">
          <span className="text-gray-600">Keterangan</span>
          <input
            className={inp}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={uploading || noCategories}
          />
        </label>
        <button
          type="submit"
          disabled={uploading || noCategories}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {uploading ? "Menyimpan..." : "Tambah ke galeri"}
        </button>
      </form>

      {(msg || err) && (
        <p className={`text-sm ${err ? "text-red-600" : "text-green-700"}`}>{err || msg}</p>
      )}
    </div>
  );
}
