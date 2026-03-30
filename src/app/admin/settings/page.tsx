import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { ARTICLE_COMMENTS_PER_PAGE_KEY } from "@/lib/articleCommentPagination";
import {
  MEMBER_STATUS_COMMENTS_PER_PAGE_KEY,
  MEMBER_TIMELINE_PER_PAGE_KEY,
} from "@/lib/memberStatusPagination";
import { prisma } from "@/lib/prisma";
import {
  HOME_MEMBER_TICKER_VISIBLE_KEY,
  HOME_NEWS_DOMESTIC_VISIBLE_KEY,
  HOME_NEWS_INTERNATIONAL_VISIBLE_KEY,
  HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY,
  isHomeMemberTickerVisible,
  isHomeNewsDomesticVisible,
  isHomeNewsInternationalVisible,
  parseHomeNewsHomepagePerBlock,
} from "@/lib/homePageSettings";
import {
  HOME_NEWS_RSS_DOMESTIC_URL_KEY,
  HOME_NEWS_RSS_INTERNATIONAL_URL_KEY,
} from "@/lib/homeNewsRssSettings";
import { MARKETPLACE_ESCROW_DAYS_KEY } from "@/lib/marketplaceEscrow";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [
    fee,
    commentsPer,
    timelinePer,
    statusCommentsPer,
    memberTicker,
    newsDnVis,
    newsIntVis,
    newsPerBlockHome,
    rssDn,
    rssInt,
    escrowDays,
  ] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } }),
    prisma.systemSetting.findUnique({ where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MEMBER_TIMELINE_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_MEMBER_TICKER_VISIBLE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_DOMESTIC_VISIBLE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_INTERNATIONAL_VISIBLE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_RSS_DOMESTIC_URL_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_RSS_INTERNATIONAL_URL_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MARKETPLACE_ESCROW_DAYS_KEY } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Pengaturan konten / sistem</h1>
      <p className="mt-1 text-sm text-gray-600">
        Fee platform untuk transaksi marketplace (persen) — digunakan saat modul toko diaktifkan. Pagination
        komentar artikel dan linimasa member mengatur jumlah item per halaman di halaman publik. Tampilan
        beranda: strip member baru, blok berita DN/internasional. URL RSS untuk impor cepat di Admin → Berita beranda.
      </p>
      <div className="mt-6 max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <AdminSettingsForm
          initialFee={fee?.value ?? "2.5"}
          initialArticleCommentsPerPage={commentsPer?.value ?? "10"}
          initialMemberTimelinePerPage={timelinePer?.value ?? "10"}
          initialMemberStatusCommentsPerPage={statusCommentsPer?.value ?? "10"}
          initialHomeMemberTickerVisible={isHomeMemberTickerVisible(memberTicker?.value ?? null)}
          initialHomeNewsDomesticVisible={isHomeNewsDomesticVisible(newsDnVis?.value ?? null)}
          initialHomeNewsInternationalVisible={isHomeNewsInternationalVisible(newsIntVis?.value ?? null)}
          initialHomeNewsPerBlockHomepage={String(
            parseHomeNewsHomepagePerBlock(newsPerBlockHome?.value ?? null)
          )}
          initialHomeNewsRssDomesticUrl={rssDn?.value ?? ""}
          initialHomeNewsRssInternationalUrl={rssInt?.value ?? ""}
          initialMarketplaceEscrowDays={escrowDays?.value ?? "3"}
        />
      </div>
    </div>
  );
}
