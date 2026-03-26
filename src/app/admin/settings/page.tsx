import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { ARTICLE_COMMENTS_PER_PAGE_KEY } from "@/lib/articleCommentPagination";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [fee, commentsPer] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } }),
    prisma.systemSetting.findUnique({ where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Pengaturan konten / sistem</h1>
      <p className="mt-1 text-sm text-gray-600">
        Fee platform untuk transaksi marketplace (persen) — digunakan saat modul toko diaktifkan. Jumlah komentar
        per halaman mengatur pagination di halaman artikel publik.
      </p>
      <div className="mt-6 max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <AdminSettingsForm
          initialFee={fee?.value ?? "2.5"}
          initialArticleCommentsPerPage={commentsPer?.value ?? "10"}
        />
      </div>
    </div>
  );
}
