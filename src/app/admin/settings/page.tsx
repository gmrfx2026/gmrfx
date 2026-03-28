import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { ARTICLE_COMMENTS_PER_PAGE_KEY } from "@/lib/articleCommentPagination";
import {
  MEMBER_STATUS_COMMENTS_PER_PAGE_KEY,
  MEMBER_TIMELINE_PER_PAGE_KEY,
} from "@/lib/memberStatusPagination";
import { prisma } from "@/lib/prisma";
import { HOME_MEMBER_TICKER_VISIBLE_KEY, isHomeMemberTickerVisible } from "@/lib/homePageSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [fee, commentsPer, timelinePer, statusCommentsPer, memberTicker] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } }),
    prisma.systemSetting.findUnique({ where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MEMBER_TIMELINE_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_MEMBER_TICKER_VISIBLE_KEY } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Pengaturan konten / sistem</h1>
      <p className="mt-1 text-sm text-gray-600">
        Fee platform untuk transaksi marketplace (persen) — digunakan saat modul toko diaktifkan. Pagination
        komentar artikel dan linimasa member mengatur jumlah item per halaman di halaman publik. Tampilan
        beranda: strip member baru.
      </p>
      <div className="mt-6 max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <AdminSettingsForm
          initialFee={fee?.value ?? "2.5"}
          initialArticleCommentsPerPage={commentsPer?.value ?? "10"}
          initialMemberTimelinePerPage={timelinePer?.value ?? "10"}
          initialMemberStatusCommentsPerPage={statusCommentsPer?.value ?? "10"}
          initialHomeMemberTickerVisible={isHomeMemberTickerVisible(memberTicker?.value ?? null)}
        />
      </div>
    </div>
  );
}
