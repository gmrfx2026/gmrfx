"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

const ringClass =
  "relative z-[1] mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-broker-accent/40 bg-broker-surface shadow-lg shadow-black/20 sm:mx-0 sm:h-24 sm:w-24 touch-manipulation";

export function MemberProfileAvatarZoom({
  imageSrc,
  name,
}: {
  imageSrc: string | null;
  name: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const scaleRef = useRef(1);
  scaleRef.current = scale;

  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    sx: number;
    sy: number;
    stx: number;
    sty: number;
  } | null>(null);

  const zoomAreaRef = useRef<HTMLDivElement | null>(null);

  const label = name?.trim() || "Member";
  const initial = label.slice(0, 1).toUpperCase();
  const hasImage = Boolean(imageSrc);

  const resetView = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetView();
  }, [open, resetView]);

  useEffect(() => {
    if (scale <= 1) {
      setTx(0);
      setTy(0);
    }
  }, [scale]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !hasImage) return;
    const el = zoomAreaRef.current;
    if (!el) return;

    let pinchStartDist = 0;
    let pinchStartScale = 1;

    const touchDist = (e: TouchEvent) => {
      if (e.touches.length < 2) return 0;
      const [a, b] = [e.touches[0], e.touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDist = touchDist(e);
        pinchStartScale = scaleRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        const d = touchDist(e);
        if (d <= 0) return;
        const ratio = d / pinchStartDist;
        setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale * ratio)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDist = 0;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open, hasImage]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const dz = -e.deltaY * 0.002;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + dz)));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale <= 1 || e.button !== 0) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      stx: tx,
      sty: ty,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d?.active || d.pointerId !== e.pointerId) return;
    setTx(d.stx + (e.clientX - d.sx));
    setTy(d.sty + (e.clientY - d.sy));
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = dragRef.current;
    if (d?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }

  const thumb = imageSrc ? (
    // eslint-disable-next-line @next/next/no-img-element -- thumbnail klikable; pointer-events-none agar tap mengenai <button> (penting untuk mobile / Safari)
    <img
      src={imageSrc}
      alt=""
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      draggable={false}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-2xl text-broker-muted">
      {initial}
    </div>
  );

  return (
    <>
      {hasImage ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${ringClass} block cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-broker-accent`}
          aria-label={`Perbesar foto profil ${label}`}
        >
          {thumb}
        </button>
      ) : (
        <div className={ringClass} aria-hidden>
          {thumb}
        </div>
      )}

      {open && hasImage && imageSrc && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={`Foto profil ${label}`}
              onClick={() => setOpen(false)}
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-10 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                Tutup
              </button>
              <p className="pointer-events-none absolute bottom-4 left-0 right-0 px-4 text-center text-xs text-white/70">
                Scroll untuk zoom · seret saat diperbesar · pinch di layar sentuh · Esc atau klik luar untuk tutup
              </p>
              <div
                ref={zoomAreaRef}
                className="relative flex max-h-[90vh] w-full max-w-md flex-1 items-center justify-center touch-none"
                onClick={(e) => e.stopPropagation()}
                onWheel={onWheel}
              >
                {/*
                  Wadah persegi + overflow-hidden + rounded-full = klip lingkaran tetap saat zoom
                  (object-contain pada img langsung menghasilkan oval jika rasio foto ≠ 1:1).
                */}
                <div className="relative aspect-square h-[min(72vmin,26rem)] w-[min(72vmin,26rem)] shrink-0 overflow-hidden rounded-full shadow-2xl ring-2 ring-white/15">
                  <div
                    style={{
                      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                      transformOrigin: "center center",
                      touchAction: "none",
                    }}
                    className={`h-full w-full will-change-transform ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt=""
                      className="h-full w-full select-none object-cover"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
