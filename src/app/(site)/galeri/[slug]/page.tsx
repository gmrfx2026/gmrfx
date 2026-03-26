import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GalleryCategoryViewer } from "@/components/GalleryCategoryViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = await prisma.galleryCategory.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!cat) return { title: "Galeri" };
  return {
    title: `${cat.name} — Galeri GMR FX`,
    description: cat.description?.slice(0, 160) || `Album foto: ${cat.name}`,
    openGraph: {
      title: `${cat.name} — Galeri`,
      description: cat.description ?? undefined,
      type: "website",
    },
  };
}

export default async function GalleryCategoryPage({ params }: { params: { slug: string } }) {
  const category = await prisma.galleryCategory.findUnique({
    where: { slug: params.slug },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/galeri" className="text-sm text-broker-accent hover:underline">
        ← Kembali ke kategori galeri
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">{category.name}</h1>
      {category.description && <p className="mt-2 text-sm text-broker-muted">{category.description}</p>}
      <p className="mt-1 text-xs text-broker-muted">
        {category.images.length.toLocaleString("id-ID")} foto. Klik foto untuk perbesar (zoom).
      </p>

      {category.images.length > 0 ? (
        <GalleryCategoryViewer
          categoryName={category.name}
          images={category.images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            caption: img.caption,
          }))}
        />
      ) : (
        <p className="mt-6 text-sm text-broker-muted">Belum ada foto dalam kategori ini.</p>
      )}
    </div>
  );
}
