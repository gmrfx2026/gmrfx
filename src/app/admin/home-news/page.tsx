import { prisma } from "@/lib/prisma";
import { AdminHomeNewsRssImport } from "@/components/admin/AdminHomeNewsRssImport";
import { AdminHomeNewsRow } from "@/components/admin/AdminHomeNewsRow";

export const dynamic = "force-dynamic";

export default async function AdminHomeNewsPage() {
  const items = await prisma.homeNewsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: 80,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Berita beranda</h1>
      <p className="mt-1 text-sm text-gray-600">
        Impor RSS untuk blok &quot;Berita dalam negeri&quot; dan &quot;Berita internasional&quot; di halaman utama.
      </p>

      <div className="mt-6">
        <AdminHomeNewsRssImport />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-gray-800">Entri terbaru</h2>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada berita.</p>
        ) : (
          items.map((it) => <AdminHomeNewsRow key={it.id} item={it} />)
        )}
      </div>
    </div>
  );
}
