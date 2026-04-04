"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { useRef, useState } from "react";
import { articleBodyInnerClass, articleEditorShellClass } from "@/lib/articleProseClassName";
import { ArticleTable } from "@/lib/tiptapArticleTable";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  mode?: "member" | "admin";
  /** Tampilkan tombol unggah gambar (disimpan di server, bukan base64). Default: true */
  enableArticleImageUpload?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  mode,
  enableArticleImageUpload = true,
}: Props) {
  const editorMode = mode ?? "member";
  const fileRef = useRef<HTMLInputElement>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState("");

  // State untuk input URL gambar
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState("");
  const [urlErr, setUrlErr] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Tulis artikel…" }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-xl border border-broker-border/40 shadow-lg my-6 mx-auto block",
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: editorMode === "member",
        protocols: ["http", "https", "mailto"],
      }),
      ArticleTable.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: `ProseMirror ${articleBodyInnerClass} min-h-[220px]`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  async function onPickImage(file: File | null) {
    if (!file || !editor) return;
    setImgErr("");
    setImgBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/member/article-image", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Unggah gagal");
      const url = String(data.url ?? "");
      if (!url) throw new Error("Respons tidak valid");
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
    } catch (e) {
      setImgErr(e instanceof Error ? e.message : "Unggah gagal");
    } finally {
      setImgBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function insertImageFromUrl() {
    setUrlErr("");
    const url = urlInputVal.trim();
    if (!url) { setUrlErr("URL tidak boleh kosong"); return; }
    if (!/^https?:\/\/.+/i.test(url)) {
      setUrlErr("URL harus diawali https://");
      return;
    }
    if (!editor) return;
    editor.chain().focus().setImage({ src: url, alt: "" }).run();
    setShowUrlInput(false);
    setUrlInputVal("");
  }

  if (!editor) return null;

  return (
    <div className={articleEditorShellClass}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap items-center gap-1 border-b border-broker-border p-2">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="B"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="I"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="H2"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="• List"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="1. List"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label="Kutipan"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          label="—"
        />
        <ToolbarBtn
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          active={editor.isActive("table")}
          label="Tabel"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().addRowAfter().run()}
          active={false}
          disabled={!editor.can().addRowAfter()}
          label="+Baris"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          active={false}
          disabled={!editor.can().addColumnAfter()}
          label="+Kolom"
        />
        <ToolbarBtn
          onClick={() => editor.chain().focus().deleteTable().run()}
          active={false}
          disabled={!editor.can().deleteTable()}
          label="Hps tbl"
        />
        {enableArticleImageUpload && (
          <>
            <button
              type="button"
              disabled={imgBusy}
              onClick={() => fileRef.current?.click()}
              className="rounded px-2 py-1 text-xs font-medium bg-broker-surface text-broker-muted hover:text-white disabled:opacity-50"
            >
              {imgBusy ? "Unggah…" : "📎 Unggah"}
            </button>
            <button
              type="button"
              onClick={() => { setShowUrlInput((v) => !v); setUrlErr(""); setUrlInputVal(""); }}
              className={`rounded px-2 py-1 text-xs font-medium ${showUrlInput ? "bg-broker-accent text-broker-bg" : "bg-broker-surface text-broker-muted hover:text-white"}`}
            >
              🔗 URL
            </button>
          </>
        )}
      </div>

      {/* Input URL gambar */}
      {showUrlInput && (
        <div className="flex items-center gap-2 border-b border-broker-border bg-broker-surface/40 px-3 py-2">
          <input
            type="url"
            autoFocus
            value={urlInputVal}
            onChange={(e) => setUrlInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImageFromUrl(); } if (e.key === "Escape") { setShowUrlInput(false); } }}
            placeholder="https://contoh.com/gambar.jpg"
            className="flex-1 rounded-lg border border-broker-border bg-broker-bg px-2.5 py-1.5 text-xs text-white placeholder:text-broker-muted focus:outline-none focus:ring-1 focus:ring-broker-accent"
          />
          <button
            type="button"
            onClick={insertImageFromUrl}
            className="rounded-lg bg-broker-accent px-3 py-1.5 text-xs font-semibold text-broker-bg hover:opacity-90"
          >
            Sisipkan
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="rounded-lg border border-broker-border px-2 py-1.5 text-xs text-broker-muted hover:text-white"
          >
            Batal
          </button>
          {urlErr && <span className="text-xs text-broker-danger">{urlErr}</span>}
        </div>
      )}

      {imgErr && <p className="border-b border-broker-border px-3 py-1 text-xs text-broker-danger">{imgErr}</p>}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  label,
  disabled,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-2 py-1 text-xs font-medium ${
        active ? "bg-broker-accent text-broker-bg" : "bg-broker-surface text-broker-muted hover:text-white"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}
