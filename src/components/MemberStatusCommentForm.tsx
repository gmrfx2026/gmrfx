"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/ToastProvider";
import { StatusCommentMentionPicker } from "@/components/member/StatusCommentMentionPicker";
import { insertTextAtSelection } from "@/lib/insertTextAtSelection";
import { MAX_STATUS_COMMENT_USER_MENTIONS } from "@/lib/statusCommentMentions";

const MAX_LEN = 1500;

export function MemberStatusCommentForm({
  statusId,
  compact = false,
  onSuccess,
}: {
  statusId: string;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const selRef = useRef({ start: 0, end: 0 });

  function insertMention(slug: string) {
    const token = ` {@user:${slug}}`;
    const { start, end } = selRef.current;
    const { next, caret } = insertTextAtSelection(text, start, end, token);
    setText(next.slice(0, MAX_LEN));
    queueMicrotask(() => {
      const el = taRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
        selRef.current = { start: caret, end: caret };
      }
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/status/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId, content: text }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const m = j.error ?? "Gagal";
      setErr(m);
      show(m, "err");
      return;
    }
    setText("");
    show("Komentar terkirim");
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-2 ${compact ? "" : "mt-6"}`}>
      <label className={compact ? "sr-only" : "text-xs text-broker-muted"} htmlFor={`comment-${statusId}`}>
        Tulis komentar
      </label>
      <textarea
        ref={taRef}
        id={`comment-${statusId}`}
        className="w-full rounded-lg border border-broker-border bg-broker-bg px-3 py-2 text-sm text-white"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        onSelect={(e) => {
          const t = e.currentTarget;
          selRef.current = { start: t.selectionStart, end: t.selectionEnd };
        }}
        onKeyUp={(e) => {
          const t = e.currentTarget;
          selRef.current = { start: t.selectionStart, end: t.selectionEnd };
        }}
        onKeyDown={(e) => {
          if (e.key === "@" && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setMentionOpen(true);
          }
        }}
        maxLength={MAX_LEN}
        placeholder="Komentar… Tekan @ untuk tandai SeDulur (maks. penanda terpisah: 5)."
        required
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="rounded-lg bg-broker-accent px-4 py-2 text-sm font-semibold text-broker-bg">
          Kirim
        </button>
        <span className="text-[11px] text-broker-muted">
          {text.length}/{MAX_LEN} · sampai {MAX_STATUS_COMMENT_USER_MENTIONS} @
        </span>
      </div>
      <StatusCommentMentionPicker
        open={mentionOpen}
        onClose={() => setMentionOpen(false)}
        onPick={(slug) => insertMention(slug)}
        searchInputRef={taRef}
      />
      {err && <p className="text-sm text-broker-danger">{err}</p>}
    </form>
  );
}
