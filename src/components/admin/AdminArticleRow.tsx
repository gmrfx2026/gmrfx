"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RichTextEditor } from "../RichTextEditor";

type A = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  status: string;
  author: { email: string; name: string | null };
};

export function AdminArticleRow({ article }: { article: A }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [excerpt, setExcerpt] = useState(article.excerpt ?? "");
  const [html, setHtml] = useState(article.contentHtml);
  const [loading, setLoading] = useState(false);

  async function patch(status?: string) {
    setLoading(true);
    await fetch("/api/admin/article", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: article.id,
        title,
        excerpt,
        contentHtml: html,
        ...(status ? { status } : {}),
      }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800">{article.title}</p>
          <p className="text-xs text-gray-500">
            {article.author.name ?? article.author.email} · {article.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {article.status === "PENDING" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => patch("PUBLISHED")}
              className="rounded bg-green-600 px-3 py-1 text-xs text-white"
            >
              Terbitkan
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded border border-gray-300 px-3 py-1 text-xs"
          >
            Edit
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Ringkasan"
          />
          <div>
            <label className="block text-xs text-gray-600">Isi artikel</label>
            <div className="mt-1">
              <RichTextEditor
                mode="admin"
                value={html}
                onChange={setHtml}
                placeholder="Tulis artikel…"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => patch()}
              className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border border-gray-300 px-3 py-1 text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
