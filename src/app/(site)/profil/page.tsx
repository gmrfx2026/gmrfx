import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CommentTarget } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { toMemberSlug } from "@/lib/memberSlug";
import { ProfilWalletTransfer } from "@/components/ProfilWalletTransfer";
import { ProfilWalletHistory, type WalletHistoryRow } from "@/components/ProfilWalletHistory";
import {
  memberWalletTransferWhere,
  normalizeDateRange,
  parseWalletHistoryListParams,
} from "@/lib/walletTransferFilters";
import { ProfilStatusBlock } from "@/components/ProfilStatusBlock";
import { ProfilChatBox } from "@/components/ProfilChatBox";
import { ProfilFollowSettings } from "@/components/ProfilFollowSettings";
import { ProfilNotificationsPanel } from "@/components/ProfilNotificationsPanel";
import { ProfilSecurityForms } from "@/components/ProfilSecurityForms";
import { ProfilAvatarUpload } from "@/components/ProfilAvatarUpload";
import { ProfilArticlesSection } from "@/components/ProfilArticlesSection";
import { parsePrefixedListQuery, resolvePagedWindow } from "@/lib/adminListParams";

export const dynamic = "force-dynamic";

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: {
    tab?: string;
    peerId?: string;
    chatMode?: string;
    wPage?: string;
    wFrom?: string;
    wTo?: string;
    wQ?: string;
    wPerPage?: string;
    aPage?: string;
    aPerPage?: string;
    aQ?: string;
  };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tabRaw = String(searchParams?.tab ?? "home").toLowerCase();
  if (tabRaw === "mail") {
    redirect("/profil");
  }
  const tab = tabRaw;
  const requestedPeerId = searchParams?.peerId ? String(searchParams.peerId) : null;
  const requestedChatMode = searchParams?.chatMode ? String(searchParams.chatMode).toLowerCase() : null;
  const initialChatMode = requestedPeerId
    ? "private"
    : requestedChatMode === "public"
      ? "public"
      : "private";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  const showStatus = tab === "home" || tab === "status" || tab === "artikel";
  /** Blok status di dashboard: tidak ditampilkan di Home (linimasa ada di halaman publik). */
  const showProfilStatusSection = showStatus && tab !== "home";
  const showWalletTransfer = tab === "wallet";
  const showChat = tab === "chat";
  const showSecurity = tab === "security";
  const showNotifications = tab === "notifications";
  const showArticles = tab === "home" || tab === "artikel";

  const onlineWindowMinutes = 5;
  const onlineCutoff = new Date(Date.now() - onlineWindowMinutes * 60 * 1000);

  let onlinePeerIds: string[] = [];
  if (showChat) {
    const [privateOnlineRows, publicOnlineRows] = await Promise.all([
      prisma.chatMessage.findMany({
        where: {
          createdAt: { gte: onlineCutoff },
          senderId: { not: user.id },
        },
        select: { senderId: true },
        distinct: ["senderId"],
        take: 100,
      }),
      prisma.publicChatMessage.findMany({
        where: {
          createdAt: { gte: onlineCutoff },
          senderId: { not: user.id },
        },
        select: { senderId: true },
        distinct: ["senderId"],
        take: 100,
      }),
    ]);

    onlinePeerIds = [...privateOnlineRows, ...publicOnlineRows].map((r) => r.senderId);
  }
  const onlinePeerIdSet = new Set(onlinePeerIds);

  const latestStatus = showProfilStatusSection
    ? await prisma.statusEntry.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true },
      })
    : null;

  const [statusComments, peers, walletHistoryBundle, articleBundle] = await Promise.all([
    showProfilStatusSection && latestStatus
      ? prisma.comment.findMany({
          where: { targetType: CommentTarget.STATUS, statusId: latestStatus.id, hidden: false },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    showChat
      ? (async () => {
          const candidateIds = new Set<string>(onlinePeerIds);
          if (requestedPeerId && requestedPeerId !== user.id) candidateIds.add(requestedPeerId);
          candidateIds.delete(user.id);

          const candidateArr = Array.from(candidateIds);

          const baseWhere = {
            profileComplete: true,
            memberStatus: "ACTIVE" as const,
          };

          const users =
            candidateArr.length > 0
              ? await prisma.user.findMany({
                  where: { ...baseWhere, id: { in: candidateArr } },
                  orderBy: { name: "asc" },
                  take: 40,
                  select: { id: true, name: true, email: true },
                })
              : await prisma.user.findMany({
                  where: { ...baseWhere, id: { not: user.id } },
                  orderBy: { name: "asc" },
                  take: 40,
                  select: { id: true, name: true, email: true },
                });

          return users.map((u) => ({ ...u, online: onlinePeerIdSet.has(u.id) }));
        })()
      : Promise.resolve([]),
    showWalletTransfer
      ? (async () => {
          const lp = parseWalletHistoryListParams(
            searchParams as Record<string, string | string[] | undefined>,
            "w"
          );
          const { from: fd, to: td } = normalizeDateRange(lp.fromDate, lp.toDate);
          const where = memberWalletTransferWhere(user.id, {
            from: fd ?? undefined,
            to: td ?? undefined,
            q: lp.q,
          });
          const total = await prisma.walletTransfer.count({ where });
          const totalPages = Math.max(1, Math.ceil(total / lp.pageSize) || 1);
          const page = Math.min(Math.max(1, lp.page), totalPages);
          const skip = (page - 1) * lp.pageSize;
          const raw = await prisma.walletTransfer.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: lp.pageSize,
            include: {
              fromUser: { select: { name: true, email: true, walletAddress: true } },
              toUser: { select: { name: true, email: true, walletAddress: true } },
            },
          });
          return {
            raw,
            total,
            page,
            pageSize: lp.pageSize,
            fromStr: lp.fromStr,
            toStr: lp.toStr,
            q: lp.q,
          };
        })()
      : Promise.resolve(null),
    showArticles
      ? (async () => {
          const lp = parsePrefixedListQuery(
            searchParams as Record<string, string | string[] | undefined>,
            "a"
          );
          const where: Prisma.ArticleWhereInput = {
            authorId: user.id,
            ...(lp.q
              ? {
                  OR: [
                    { title: { contains: lp.q, mode: "insensitive" } },
                    { slug: { contains: lp.q, mode: "insensitive" } },
                    { excerpt: { contains: lp.q, mode: "insensitive" } },
                  ],
                }
              : {}),
          };
          const total = await prisma.article.count({ where });
          const { page, skip, totalPages } = resolvePagedWindow(lp.page, lp.pageSize, total);
          const articles = await prisma.article.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            skip,
            take: lp.pageSize,
            select: { id: true, title: true, status: true, slug: true },
          });
          return { articles, total, page, pageSize: lp.pageSize, q: lp.q, totalPages };
        })()
      : Promise.resolve(null),
  ]);

  const walletHistoryRows: WalletHistoryRow[] =
    showWalletTransfer && walletHistoryBundle
      ? walletHistoryBundle.raw.map((t) => {
          const outgoing = t.fromUserId === user.id;
          const cp = outgoing ? t.toUser : t.fromUser;
          return {
            id: t.id,
            transactionId: t.transactionId,
            direction: outgoing ? ("out" as const) : ("in" as const),
            amount: Number(t.amount),
            note: t.note,
            createdAt: t.createdAt.toISOString(),
            counterpartyLabel: cp.name ?? cp.email,
            counterpartyWallet: cp.walletAddress,
          };
        })
      : [];

  const bal = Number(user.walletBalance);
  const ownerSlug = user.memberSlug ?? toMemberSlug(user.name, user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center md:w-48">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-broker-accent/40 bg-broker-surface">
            {user.image?.startsWith("/") ? (
              <Image src={user.image} alt="" fill className="object-cover" unoptimized />
            ) : user.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL eksternal di luar remotePatterns next/image
              <img src={user.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-broker-muted">
                {(user.name ?? user.email).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <ProfilAvatarUpload />
          <Link
            href={`/${ownerSlug}`}
            className="mt-3 block text-center text-sm font-medium text-white hover:text-broker-accent hover:underline"
          >
            {user.name ?? user.email}
          </Link>
          <p className="text-center text-xs text-broker-muted">{user.email}</p>
        </div>

        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold text-white">Dashboard member</h1>
          <p className="text-sm text-broker-muted">
            <span className="md:hidden">Pilih menu mengambang di bawah layar untuk mengakses fitur.</span>
            <span className="hidden md:inline">Pilih menu di kiri untuk mengakses fitur.</span>
          </p>

          <div className="mt-4 rounded-xl border border-broker-border bg-broker-surface/40 p-4">
            <p className="text-xs uppercase tracking-wider text-broker-accent">Saldo (IDR)</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {bal.toLocaleString("id-ID", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-2 text-sm text-broker-muted">
              Alamat wallet:{" "}
              <span className="font-mono text-broker-gold">{user.walletAddress ?? "—"}</span>
            </p>
          </div>
        </div>
      </div>

      {showWalletTransfer && (
        <>
          <section className="border-t border-broker-border pt-10">
            <ProfilWalletTransfer />
          </section>
          {walletHistoryBundle && (
            <ProfilWalletHistory
              rows={walletHistoryRows}
              total={walletHistoryBundle.total}
              page={walletHistoryBundle.page}
              pageSize={walletHistoryBundle.pageSize}
              fromStr={walletHistoryBundle.fromStr}
              toStr={walletHistoryBundle.toStr}
              q={walletHistoryBundle.q}
            />
          )}
        </>
      )}

      {showSecurity && (
        <section className="border-t border-broker-border pt-10 space-y-8">
          <ProfilFollowSettings initialMode={user.followApprovalMode} />
          <ProfilSecurityForms />
        </section>
      )}

      {showNotifications && (
        <section className="border-t border-broker-border pt-10">
          <h1 className="text-2xl font-bold text-white">Notifikasi</h1>
          <p className="mt-1 text-sm text-broker-muted">
            Permintaan mengikuti, pemberitahuan aktivitas dari akun yang Anda ikuti, dan lainnya.
          </p>
          <div className="mt-6">
            <ProfilNotificationsPanel />
          </div>
        </section>
      )}

      {showProfilStatusSection && (
        <section className="border-t border-broker-border pt-10">
          <ProfilStatusBlock
            initialStatus={latestStatus?.content ?? user.profileStatus ?? ""}
            ownerSlug={ownerSlug}
            comments={statusComments.map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.createdAt.toISOString(),
              author: c.user.name ?? "Member",
            }))}
          />
        </section>
      )}

      {showArticles && articleBundle && (
        <ProfilArticlesSection
          profileTab={tab}
          articles={articleBundle.articles}
          total={articleBundle.total}
          page={articleBundle.page}
          pageSize={articleBundle.pageSize}
          totalPages={articleBundle.totalPages}
          q={articleBundle.q}
        />
      )}

      {showChat && (
        <section className="border-t border-broker-border pt-10">
          <ProfilChatBox
            peers={peers}
            selfId={user.id}
            initialPeerId={requestedPeerId ?? undefined}
            initialMode={initialChatMode}
          />
        </section>
      )}
    </div>
  );
}
