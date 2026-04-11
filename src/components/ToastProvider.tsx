"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Tone = "ok" | "err" | "warn";

type Toast = { id: number; message: string; tone: Tone };

type Ctx = { show: (message: string, tone?: Tone) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const show = useCallback((message: string, tone: Tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const toastStack = (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex max-w-sm shrink-0 flex-col gap-2 px-4 sm:bottom-6 sm:right-6"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-lg border px-4 py-2 text-sm shadow-lg ${
            t.tone === "err"
              ? "border-red-500/40 bg-red-950/95 text-red-50"
              : t.tone === "warn"
                ? "border-amber-500/40 bg-amber-950/90 text-amber-100"
                : "border-broker-border bg-broker-surface/95 text-white"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted ? createPortal(toastStack, document.body) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const v = useContext(ToastContext);
  if (!v) {
    return { show: (_m: string, _t?: Tone) => {} };
  }
  return v;
}
