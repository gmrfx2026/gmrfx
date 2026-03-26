import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GalleryImage } from "@/components/GalleryImage";

export const metadata: Metadata = {
  title: "Galeri — GMR FX",
  description: "Kumpulan foto edukasi per kategori.",
  openGraph: { title: "Galeri — GMR FX", description: "Foto edukasi dikelola per kategori." },
};

export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const categories = await prisma.galleryCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      images: { orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }], take: 1 },
      _count: { select: { images: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Galeri</h1>
      <p className="mt-2 text-sm text-broker-muted">
        Foto dikelompokkan per kategori. Klik kategori untuk melihat semua foto dan zoom per foto.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const latest = cat.images[0] ?? null;
          return (
            <Link
              key={cat.id}
              href={`/galeri/${cat.slug}`}
              className="group overflow-hidden rounded-xl border border-broker-border bg-broker-surface/40 transition hover:border-broker-accent/40"
            >
              {latest ? (
                <div className="overflow-hidden transition duration-300 group-hover:scale-[1.03]">
                  <GalleryImage
                    src={latest.imageUrl}
                    alt={latest.caption ?? cat.name}
                    wrapperClassName="relative aspect-video w-full"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-broker-surface/80 text-sm text-broker-muted">
                  Belum ada foto
                </div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-broker-accent">{cat.name}</h2>
                {cat.description && <p className="mt-1 line-clamp-2 text-sm text-broker-muted">{cat.description}</p>}
                <p className="mt-2 text-xs text-broker-muted">
                  {cat._count.images.toLocaleString("id-ID")} foto · klik untuk buka kategori
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {categories.length === 0 && (
        <p className="mt-10 text-center text-broker-muted">Belum ada kategori galeri.</p>
      )}
    </div>
  );
}
