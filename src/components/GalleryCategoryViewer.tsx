"use client";

import { useState } from "react";
import { GalleryImage } from "@/components/GalleryImage";

type GalleryImageItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

export function GalleryCategoryViewer({
  categoryName,
  images,
}: {
  categoryName: string;
  images: GalleryImageItem[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex == null ? null : images[activeIndex];

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className="overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 text-left transition hover:border-broker-accent/40"
          >
            <GalleryImage
              src={img.imageUrl}
              alt={img.caption ?? categoryName}
              wrapperClassName="relative aspect-video w-full overflow-hidden"
            />
            {img.caption && <p className="p-3 text-xs text-broker-muted">{img.caption}</p>}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau gambar"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md border border-white/20 bg-black/50 px-3 py-1.5 text-sm text-white"
            onClick={() => setActiveIndex(null)}
          >
            Tutup
          </button>
          <div className="max-h-[92vh] w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.imageUrl} alt={active.caption ?? categoryName} className="max-h-[82vh] w-full rounded-lg object-contain" />
            {active.caption && <p className="mt-3 text-center text-sm text-zinc-300">{active.caption}</p>}
          </div>
        </div>
      )}
    </>
  );
}
