"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArticleCommentPaginationNav } from "@/components/ArticleCommentPaginationNav";
import { buildArtikelCommentLastPageHref } from "@/lib/articleCommentPagination";
import { useToast } from "@/components/ToastProvider";

const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000;

type InitialComment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { name: string | null };
};

type C = InitialComment & { canEditOrDelete: boolean };

function applyEditFlags(comments: InitialComment[], viewerId: string | null): C[] {
  const now = Date.now();
  return comments.map((c) => ({
    ...c,
    canEditOrDelete:
      viewerId != null &&
      c.userId === viewerId &&
      now - new Date(c.createdAt).getTime() <= COMMENT_EDIT_WINDOW_MS,
  }));
}

export function ArticleInteractions({
  articleSlug,
  articleId,
  articleAuthorId,
  commentPage,
  commentPageSize,
  commentTotal,
  commentTotalPages,
  initialComments,
}: {
  articleSlug: string;
  articleId: string;
  articleAuthorId: string;
  commentPage: number;
  commentPageSize: number;
  commentTotal: number;
  commentTotalPages: number;
  initialComments: InitialComment[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { show } = useToast();
  const [comment, setComment] = useState("");
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const viewerId = session?.user?.id ?? null;
  const [rows, setRows] = useState<C[]>(() => applyEditFlags(initialComments, null));

  useEffect(() => {
    setRows(applyEditFlags(initialComments, viewerId));
  }, [initialComments, viewerId]);

  const isAuthor = session?.user?.id === articleAuthorId;

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/article/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, content: comment }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err = j.error ?? "Gagal mengirim komentar";
      setMsg(err);
      show(err, "err");
      return;
    }
    setComment("");
    show("Komentar terkirim");
    router.push(buildArtikelCommentLastPageHref(articleSlug));
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/article/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, stars }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err = j.error ?? "Gagal memberi rating";
      setMsg(err);
      show(err, "err");
      return;
    }
    show("Rating disimpan");
    router.refresh();
  }

  async function saveEdit(id: string, content: string): Promise<boolean> {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/article/comment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err = j.error ?? "Gagal menyimpan";
      setMsg(err);
      show(err, "err");
      return false;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, content } : r)));
    show("Komentar diperbarui");
    router.refresh();
    return true;
  }

  async function removeComment(id: string) {
    if (!confirm("Hapus komentar ini?")) return;
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/article/comment?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err = j.error ?? "Gagal menghapus";
      setMsg(err);
      show(err, "err");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    show("Komentar dihapus");
    router.refresh();
  }

  const fromIdx = commentTotal === 0 ? 0 : (commentPage - 1) * commentPageSize + 1;
  const toIdx = Math.min(commentPage * commentPageSize, commentTotal);

  return (
    <div className="mt-12 border-t border-broker-border pt-10">
      <h2 className="text-lg font-semibold text-white">Komentar</h2>
      {commentTotal > 0 && (
        <p className="mt-1 text-xs text-broker-muted">
          Menampilkan {fromIdx}–{toIdx} dari {commentTotal} · urutan kronologis (lebih lama di atas, lebih baru di
          bawah)
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {rows.map((c) => (
          <ArticleCommentRow
            key={c.id}
            c={c}
            loading={loading}
            onSave={saveEdit}
            onDelete={removeComment}
          />
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="mt-4 text-sm text-broker-muted">Belum ada komentar. Jadilah yang pertama.</p>
      )}

      <ArticleCommentPaginationNav slug={articleSlug} page={commentPage} totalPages={commentTotalPages} />

      {status === "authenticated" ? (
        <div className="mt-8 space-y-8">
          <form onSubmit={submitComment} className="space-y-3">
            <label className="block text-sm text-broker-muted">Tulis komentar</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
              rows={3}
              maxLength={2000}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg disabled:opacity-50"
            >
              Kirim komentar
            </button>
          </form>
          {!isAuthor ? (
            <form onSubmit={submitRating} className="space-y-3 border-t border-broker-border pt-8">
              <label className="block text-sm text-broker-muted">Rating artikel</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = hover != null ? n <= hover : n <= stars;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStars(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(null)}
                      aria-label={`Pilih ${n} bintang`}
                      className={`text-2xl leading-none transition ${
                        filled ? "text-broker-gold" : "text-broker-muted"
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
                <span className="ml-2 text-xs text-broker-muted">{stars}/5</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-broker-gold/50 px-4 py-2 text-sm font-medium text-broker-gold disabled:opacity-50"
              >
                Simpan rating
              </button>
            </form>
          ) : (
            <p className="border-t border-broker-border pt-8 text-sm text-broker-muted">
              Sebagai penulis artikel, Anda tidak dapat memberi rating pada artikel sendiri.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-broker-muted">Login untuk berkomentar dan memberi rating.</p>
      )}
      {msg && <p className="mt-4 text-sm text-broker-danger">{msg}</p>}
    </div>
  );
}

function ArticleCommentRow({
  c,
  loading,
  onSave,
  onDelete,
}: {
  c: C;
  loading: boolean;
  onSave: (id: string, content: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.content);

  useEffect(() => {
    setDraft(c.content);
  }, [c.content]);

  return (
    <li className="rounded-lg border border-broker-border bg-broker-surface/30 p-3 text-sm">
      <p className="font-medium text-broker-accent">{c.user.name ?? "Member"}</p>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
            rows={3}
            maxLength={2000}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !draft.trim()}
              onClick={async () => {
                const ok = await onSave(c.id, draft.trim());
                if (ok) setEditing(false);
              }}
              className="rounded bg-broker-accent px-3 py-1 text-xs font-semibold text-broker-bg disabled:opacity-50"
            >
              Simpan
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setDraft(c.content);
                setEditing(false);
              }}
              className="rounded border border-broker-border px-3 py-1 text-xs text-broker-muted"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-broker-muted">{c.content}</p>
      )}
      <p className="mt-2 text-xs text-broker-muted/70">
        {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(new Date(c.createdAt))}
      </p>
      {c.canEditOrDelete && !editing && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => setEditing(true)}
            className="text-xs text-broker-accent hover:underline disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onDelete(c.id)}
            className="text-xs text-broker-danger hover:underline disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      )}
    </li>
  );
}
