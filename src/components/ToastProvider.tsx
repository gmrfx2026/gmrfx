"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Tone = "ok" | "err";

type Toast = { id: number; message: string; tone: Tone };

type Ctx = { show: (message: string, tone?: Tone) => void };

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
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
                : "border-broker-border bg-broker-surface/95 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
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
