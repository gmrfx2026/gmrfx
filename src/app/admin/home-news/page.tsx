import { prisma } from "@/lib/prisma";
import { findManyHomeNewsWithAuthorCard } from "@/lib/homeNewsItemFetch";
import {
  HOME_NEWS_RSS_DOMESTIC_URL_KEY,
  HOME_NEWS_RSS_INTERNATIONAL_URL_KEY,
} from "@/lib/homeNewsRssSettings";
import { homeNewsAuthorForDisplay } from "@/lib/homeNewsAuthor";
import { AdminHomeNewsRssImport } from "@/components/admin/AdminHomeNewsRssImport";
import { AdminHomeNewsRow } from "@/components/admin/AdminHomeNewsRow";

export const dynamic = "force-dynamic";

export default async function AdminHomeNewsPage() {
  const [items, rssDn, rssInt] = await Promise.all([
    findManyHomeNewsWithAuthorCard({
      orderBy: { publishedAt: "desc" },
      take: 80,
    }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_RSS_DOMESTIC_URL_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_RSS_INTERNATIONAL_URL_KEY } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Berita beranda</h1>
      <p className="mt-1 text-sm text-gray-600">
        Impor RSS untuk blok &quot;Berita dalam negeri&quot; dan &quot;Berita internasional&quot; di halaman utama.
      </p>

      <div className="mt-6">
        <AdminHomeNewsRssImport
          savedDomesticUrl={rssDn?.value ?? ""}
          savedInternationalUrl={rssInt?.value ?? ""}
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-gray-800">Entri terbaru</h2>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada berita.</p>
        ) : (
          items.map((it) => {
            const p = homeNewsAuthorForDisplay(it.author);
            return (
              <AdminHomeNewsRow
                key={it.id}
                item={it}
                authorLabel={p.label}
                authorHref={p.href}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
