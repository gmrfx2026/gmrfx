"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Gambar hero berita: proporsional lebar artikel, klik untuk perbesar. */
export function BeritaHeroImage({ src, title }: { src: string; title: string }) {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <>
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="mt-6 w-full overflow-hidden rounded-xl border border-broker-border bg-black/20 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-broker-accent"
        aria-label={`Perbesar gambar berita: ${title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="mx-auto max-h-[min(85vh,720px)] w-full object-contain"
          loading="eager"
        />
      </button>
      {zoom && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
              onClick={() => setZoom(false)}
              role="dialog"
              aria-modal="true"
              aria-label={`Gambar berita ${title}`}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                onClick={() => setZoom(false)}
              >
                Tutup
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="max-h-[90vh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
