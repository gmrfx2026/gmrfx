import { prisma } from "@/lib/prisma";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";
import { buildPortfolioStatsModel } from "@/lib/mt5Stats";
import { PortfolioAccountStatsBoard } from "@/components/portfolio/PortfolioAccountStatsBoard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Ringkasan statistik akun yang dipublikasikan di komunitas (tanpa menampilkan nomor login di daftar). */
export default async function CommunityPublishedAccountSummaryPage({
  params,
}: {
  params: { ownerId: string; mtLogin: string };
}) {
  const ownerId = decodeURIComponent(params.ownerId);
  const mtLogin = decodeURIComponent(params.mtLogin);

  if (!ownerId || !mtLogin) notFound();

  const pub = await prisma.mtCommunityPublishedAccount.findFirst({
    where: {
      userId: ownerId,
      mtLogin,
      allowCopy: true,
      user: { ...listablePublicMemberWhere },
    },
    include: {
      user: { select: { name: true, memberSlug: true } },
    },
  });

  if (!pub) notFound();

  const [deals, snaps] = await Promise.all([
    prisma.mtDeal.findMany({
      where: { userId: ownerId, mtLogin },
      orderBy: { dealTime: "asc" },
      select: {
        dealTime: true,
        symbol: true,
        dealType: true,
        entryType: true,
        volume: true,
        price: true,
        commission: true,
        swap: true,
        profit: true,
      },
    }),
    prisma.mtAccountSnapshot.findMany({
      where: { userId: ownerId, mtLogin },
      orderBy: { recordedAt: "asc" },
      select: {
        recordedAt: true,
        balance: true,
        equity: true,
        currency: true,
        brokerName: true,
        brokerServer: true,
        tradeAccountName: true,
      },
    }),
  ]);

  const model = buildPortfolioStatsModel(deals, snaps, mtLogin);

  const tradeName = model.tradeAccountName?.trim() ?? "";
  const ownerNm = pub.user.name?.trim() ?? null;
  const accountTitle =
    tradeName.length > 0 ? tradeName : ownerNm && ownerNm.length > 0 ? ownerNm : "Akun trading";

  return (
    <div className="space-y-6">
      <PortfolioAccountStatsBoard
        model={model}
        communityPresentation={{
          accountTitle,
          ownerName: pub.user.name,
          ownerSlug: pub.user.memberSlug,
        }}
      />
    </div>
  );
}
