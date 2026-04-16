"use client";

import { useEffect, useRef, useState } from "react";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Sering dipakai",
    emojis: ["😀","😂","🤣","😊","😍","🥰","😘","😉","😎","🤩","😇","🙂","😅","😆","😋","🤗","🤔","🙄","😏","😴","😭","😤","😡","🤯","😱","😳","🥺","🤤","😪","🤭"],
  },
  {
    label: "Gestur & tangan",
    emojis: ["👍","👎","👏","🙏","🤝","👌","🤞","✌️","🤟","🤘","👊","✊","🤲","🙌","💪","👋","🫡","🫶","🫰","🤌"],
  },
  {
    label: "Hati & simbol",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","🔥","⭐","🌟","✨","💯","✅","❌","⚡","🎉","🎊","🏆","🚀"],
  },
];

export function ChatEmojiPicker({
  open,
  onClose,
  onPick,
  anchorClassName,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  anchorClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute z-[170] w-[260px] rounded-2xl border border-broker-border bg-broker-surface p-2 shadow-2xl shadow-black/50 ${anchorClassName ?? "bottom-[3.25rem] right-0"}`}
      role="dialog"
      aria-label="Pilih emoji"
    >
      <div className="mb-1 flex gap-1">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setTab(i)}
            className={
              tab === i
                ? "rounded-full bg-broker-accent px-2.5 py-1 text-[10px] font-semibold text-broker-bg"
                : "rounded-full border border-broker-border bg-broker-bg px-2.5 py-1 text-[10px] font-medium text-broker-muted hover:text-white"
            }
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto [scrollbar-width:thin]">
        {EMOJI_GROUPS[tab].emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-broker-bg"
            aria-label={`Emoji ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
