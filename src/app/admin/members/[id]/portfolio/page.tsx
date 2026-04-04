import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildPortfolioStatsModel } from "@/lib/mt5Stats";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";
import { PortfolioAccountStatsBoard } from "@/components/portfolio/PortfolioAccountStatsBoard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { name: true, email: true } });
  const nm = user?.name ?? user?.email ?? params.id;
  return { title: `Portofolio ${nm} — Admin GMR FX` };
}

async function getLogins(userId: string): Promise<string[]> {
  const [fromDeals, fromSnaps] = await Promise.all([
    prisma.mtDeal.groupBy({ by: ["mtLogin"], where: { userId } }),
    prisma.mtAccountSnapshot.groupBy({ by: ["mtLogin"], where: { userId } }),
  ]);
  const set = new Set<string>();
  for (const r of fromDeals) set.add(r.mtLogin);
  for (const r of fromSnaps) set.add(r.mtLogin);
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export default async function AdminMemberPortfolioPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { mtLogin?: string };
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const member = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, memberSlug: true },
  });
  if (!member) notFound();

  const logins = await getLogins(params.id);
  const mtLoginParam = typeof searchParams?.mtLogin === "string" ? searchParams.mtLogin.trim() : "";

  const snapHints =
    logins.length > 0
      ? await prisma.mtAccountSnapshot.findMany({
          where: { userId: params.id, mtLogin: { in: logins } },
          orderBy: { recordedAt: "desc" },
          select: { mtLogin: true, tradeAccountName: true, brokerName: true },
        })
      : [];
  const tradeNameByLogin = new Map<string, string>();
  for (const s of snapHints) {
    if (tradeNameByLogin.has(s.mtLogin)) continue;
    const n = s.tradeAccountName?.trim();
    if (n) tradeNameByLogin.set(s.mtLogin, n);
  }

  const memberLabel = member.name ?? member.email;
  const backHref = "/admin/members/portfolio";

  if (logins.length === 0) {
    return (
      <div className="space-y-4">
        <AdminPortfolioHeader memberLabel={memberLabel} backHref={backHref} memberId={params.id} memberSlug={member.memberSlug} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Member ini belum memiliki data MetaTrader (deal / snapshot).
        </div>
      </div>
    );
  }

  if (mtLoginParam && !logins.includes(mtLoginParam)) {
    redirect(`/admin/members/${params.id}/portfolio`);
  }

  if (!mtLoginParam) {
    return (
      <div className="space-y-4">
        <AdminPortfolioHeader memberLabel={memberLabel} backHref={backHref} memberId={params.id} memberSlug={member.memberSlug} />
        <p className="text-sm text-gray-500">Pilih akun MetaTrader di bawah:</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {logins.map((login) => {
            const label = tradeNameByLogin.get(login);
            return (
              <Link
                key={login}
                href={`/admin/members/${params.id}/portfolio?mtLogin=${encodeURIComponent(login)}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-green-400 hover:bg-green-50/40 transition"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Akun MetaTrader</p>
                {label && <p className="mt-1 truncate text-sm font-semibold text-gray-800">{label}</p>}
                <p className="mt-1 font-mono text-lg font-bold text-green-700">{login}</p>
                <p className="mt-2 text-xs text-gray-400">Lihat dashboard →</p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const mtLogin = mtLoginParam;

  const [deals, snaps, actRow] = await Promise.all([
    prisma.mtDeal.findMany({
      where: { userId: params.id, mtLogin },
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
      where: { userId: params.id, mtLogin },
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
    prisma.mtTradingActivity.findUnique({
      where: { userId_mtLogin: { userId: params.id, mtLogin } },
    }),
  ]);

  const model = buildPortfolioStatsModel(deals, snaps, mtLogin);
  const activity = tradingActivityFromRow(actRow);

  return (
    <div className="space-y-5">
      <AdminPortfolioHeader
        memberLabel={memberLabel}
        backHref={backHref}
        memberId={params.id}
        memberSlug={member.memberSlug}
        mtLogin={mtLogin}
        logins={logins}
      />

      {/* Banner: ini tampilan admin */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tampilan admin — portofolio ini ditampilkan terlepas dari status publikasi member.
      </div>

      <PortfolioAccountStatsBoard
        model={model}
        activity={activity}
        activityPoll={{
          url: `/api/portfolio/community/mt-activity?ownerId=${encodeURIComponent(params.id)}&mtLogin=${encodeURIComponent(mtLogin)}`,
          intervalMs: 15_000,
        }}
        communityPresentation={{
          accountTitle: tradeNameByLogin.get(mtLogin) ?? memberLabel,
          ownerName: member.name,
          ownerSlug: member.memberSlug,
        }}
      />
    </div>
  );
}

function AdminPortfolioHeader({
  memberLabel,
  backHref,
  memberId,
  memberSlug,
  mtLogin,
  logins,
}: {
  memberLabel: string;
  backHref: string;
  memberId: string;
  memberSlug: string | null;
  mtLogin?: string;
  logins?: string[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href={backHref} className="hover:text-green-700 hover:underline">
            ← Portofolio member
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-700">{memberLabel}</span>
          {mtLogin && <><span>/</span><span className="font-mono text-gray-500">{mtLogin}</span></>}
        </div>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Dashboard Portofolio</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {mtLogin && logins && logins.length > 1 && (
          <Link
            href={`/admin/members/${memberId}/portfolio`}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Ganti akun
          </Link>
        )}
        {memberSlug && (
          <Link
            href={`/${memberSlug}`}
            target="_blank"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Profil publik ↗
          </Link>
        )}
      </div>
    </div>
  );
}
