import { prisma } from "@/lib/prisma";
import { AdminGalleryForms } from "@/components/admin/AdminGalleryForms";
import { AdminGalleryItemActions } from "@/components/admin/AdminGalleryItemActions";
import { AdminListFilterForm, AdminListSummary } from "@/components/admin/AdminListFilterForm";
import { AdminPaginationNav } from "@/components/admin/AdminPaginationNav";
import { parseAdminListQuery, resolvePagedWindow } from "@/lib/adminListParams";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: { page?: string; perPage?: string; q?: string };
}) {
  const lp = parseAdminListQuery(searchParams as Record<string, string | string[] | undefined>);
  const q = lp.q;

  const categories = await prisma.galleryCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { images: true } } },
  });

  const where: Prisma.GalleryImageWhereInput = q
    ? {
        OR: [
          { caption: { contains: q, mode: "insensitive" } },
          { imageUrl: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
          { category: { slug: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const total = await prisma.galleryImage.count({ where });
  const { page, skip, totalPages } = resolvePagedWindow(lp.page, lp.pageSize, total);

  const images = await prisma.galleryImage.findMany({
    where,
    orderBy: [{ category: { name: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
    skip,
    take: lp.pageSize,
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  const grouped = new Map<
    string,
    { categoryId: string; categoryName: string; categorySlug: string; items: typeof images }
  >();
  for (const img of images) {
    const key = img.category.id;
    const found = grouped.get(key);
    if (found) {
      found.items.push(img);
      continue;
    }
    grouped.set(key, {
      categoryId: img.category.id,
      categoryName: img.category.name,
      categorySlug: img.category.slug,
      items: [img],
    });
  }
  const groupedList = Array.from(grouped.values());
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Galeri</h1>
      <p className="mt-1 text-sm text-gray-600">
        Kategori + upload file gambar (JPG/PNG/WebP, maks. 2,5 MB). URL manual tetap tersedia sebagai opsi.
      </p>
      <AdminGalleryForms
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageCount: c._count.images,
        }))}
      />

      <h2 className="mt-10 text-xl font-semibold text-gray-800">Data galeri</h2>
      <p className="mt-1 text-sm text-gray-600">Dikelompokkan per kategori, bisa cari/edit/hapus.</p>

      <AdminListFilterForm
        actionPath="/admin/gallery"
        qDefault={lp.q}
        perPageDefault={lp.pageSize}
        searchPlaceholder="Caption, URL, nama kategori, slug kategori…"
      />
      <AdminListSummary total={total} page={page} pageSize={lp.pageSize} totalPages={totalPages} />

      <div className="mt-6 space-y-6">
        {groupedList.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Tidak ada item galeri yang cocok dengan filter.
          </div>
        )}
        {groupedList.map((group) => (
          <section key={group.categoryId} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-800">{group.categoryName}</h3>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{group.categorySlug}</span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                {group.items.length} item (halaman ini)
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((img) => (
                <article key={img.id} className="rounded-lg border border-gray-200 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt={img.caption ?? group.categoryName} className="h-40 w-full rounded object-cover" />
                  <p className="mt-2 line-clamp-2 text-sm text-gray-700">{img.caption || "Tanpa keterangan"}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{img.imageUrl}</p>
                  <AdminGalleryItemActions
                    item={{
                      id: img.id,
                      imageUrl: img.imageUrl,
                      caption: img.caption,
                      categoryId: img.categoryId,
                      sortOrder: img.sortOrder,
                    }}
                    categories={categoryOptions}
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <AdminPaginationNav path="/admin/gallery" page={page} totalPages={totalPages} perPage={lp.pageSize} q={lp.q} />
    </div>
  );
}
