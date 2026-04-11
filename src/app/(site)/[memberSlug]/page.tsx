import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SmallUserAvatar } from "@/components/SmallUserAvatar";
import { DeleteStatusButton } from "@/components/member/DeleteStatusButton";
import { DeleteStatusCommentButton } from "@/components/member/DeleteStatusCommentButton";
import { MemberStatusCommentLikeButton } from "@/components/member/MemberStatusCommentLikeButton";
import { StatusCommentBody } from "@/components/member/StatusCommentBody";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, CommentTarget } from "@prisma/client";
import { MemberStatusActions } from "@/components/MemberStatusActions";
import { MemberStatusComposer } from "@/components/MemberStatusComposer";
import { MemberFollowButton, MemberFollowLoginLink } from "@/components/member/MemberFollowButton";
import { MemberFollowStatsLinks } from "@/components/member/MemberFollowStatsLinks";
import { MemberSocialLinks } from "@/components/member/MemberSocialLinks";
import { MemberProfileShare } from "@/components/member/MemberProfileShare";
import { requestOrigin } from "@/lib/requestOrigin";
import { unstable_noStore as noStore } from "next/cache";
import {
  buildMemberProfileHref,
  getMemberStatusCommentsPerPage,
  getMemberTimelinePerPage,
  parseCommentPageForStatus,
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/memberStatusPagination";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { enrichStatusComments, type EnrichedStatusComment } from "@/lib/enrichStatusComments";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseStatusPage(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function MemberBySlugPage({
  params,
  searchParams: searchParamsIn,
}: {
  params: { memberSlug: string };
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
}) {
  noStore();
  const searchParams = await resolvePageSearchParams(searchParamsIn);
  const slug = params.memberSlug;

  // Cari dulu exact match agar URL stabil.
  // Jika tidak ditemukan, fallback ke prefix match supaya pengguna bisa pakai `/nama` tanpa suffix UID.
  let member = await prisma.user.findFirst({
    where: {
      memberSlug: slug,
      memberStatus: "ACTIVE",
      profileComplete: true,
    },
    select: {
      id: true,
      name: true,
      kabupaten: true,
      image: true,
      memberSlug: true,
      followApprovalMode: true,
      socialTiktokUrl: true,
      socialInstagramUrl: true,
      socialFacebookUrl: true,
      socialTelegramUrl: true,
      socialYoutubeUrl: true,
    },
  });

  if (!member) {
    member = await prisma.user.findFirst({
      where: {
        memberSlug: { startsWith: slug },
        memberStatus: "ACTIVE",
        profileComplete: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        kabupaten: true,
        image: true,
        memberSlug: true,
        followApprovalMode: true,
        socialTiktokUrl: true,
        socialInstagramUrl: true,
        socialFacebookUrl: true,
        socialTelegramUrl: true,
        socialYoutubeUrl: true,
      },
    });
  }

  if (!member) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const isSelf = viewerId != null && viewerId === member.id;
  const chatPathForViewer = `/profil?tab=chat&peerId=${encodeURIComponent(member.id)}`;
  const chatHref = isSelf
    ? null
    : viewerId
      ? chatPathForViewer
      : `/login?callbackUrl=${encodeURIComponent(`/${member.memberSlug}`)}`;

  const [statusPageSizeRaw, commentPageSizeRaw] = await Promise.all([
    getMemberTimelinePerPage(),
    getMemberStatusCommentsPerPage(),
  ]);
  const statusPageSize = Math.max(1, statusPageSizeRaw);
  const commentPageSize = Math.max(1, commentPageSizeRaw);

  const statusTotal = await prisma.statusEntry.count({ where: { userId: member.id } });
  const statusTotalPages = Math.max(1, Math.ceil(statusTotal / statusPageSize) || 1);
  const stPageRaw = searchParams?.stPage;
  const stPageStr = Array.isArray(stPageRaw) ? stPageRaw[0] : stPageRaw;
  const safeStatusPage = Math.min(parseStatusPage(stPageStr), statusTotalPages);
  const statusSkip = (safeStatusPage - 1) * statusPageSize;

  const [statuses, articles, followerCount, followingCount, viewerFollows] = await Promise.all([
      prisma.statusEntry.findMany({
        where: { userId: member.id },
        orderBy: { createdAt: "desc" },
        skip: statusSkip,
        take: statusPageSize,
      }),
      prisma.article.findMany({
        where: { authorId: member.id, status: ArticleStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true },
      }),
      prisma.memberFollow.count({
        where: {
          followingId: member.id,
          status: "ACCEPTED",
          follower: listablePublicMemberWhere,
        },
      }),
      prisma.memberFollow.count({
        where: {
          followerId: member.id,
          status: "ACCEPTED",
          following: listablePublicMemberWhere,
        },
      }),
      viewerId && viewerId !== member.id
        ? prisma.memberFollow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: member.id,
              },
            },
            select: { id: true, status: true },
          })
        : Promise.resolve(null),
  ]);

  const statusIds = statuses.map((s) => s.id);

  const commentByStatusId = new Map<
    string,
    {
      comments: EnrichedStatusComment[];
      total: number;
      safePage: number;
      totalPages: number;
    }
  >();
  if (statusIds.length > 0) {
    const counts = await prisma.comment.groupBy({
      by: ["statusId"],
      where: {
        targetType: CommentTarget.STATUS,
        statusId: { in: statusIds },
        hidden: false,
      },
      _count: { _all: true },
    });
    const countById = new Map(counts.map((c) => [c.statusId, c._count._all]));

    const blocks = await Promise.all(
      statusIds.map(async (statusId) => {
        const total = countById.get(statusId) ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / commentPageSize));
        const requested = parseCommentPageForStatus(searchParams, statusId);
        const safePage = Math.min(Math.max(1, requested), totalPages);
        const skip = (safePage - 1) * commentPageSize;
        const rows = await prisma.comment.findMany({
          where: {
            targetType: CommentTarget.STATUS,
            statusId,
            hidden: false,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: commentPageSize,
          include: { user: { select: { name: true, image: true } } },
        });
        const enriched = await enrichStatusComments(prisma, rows, viewerId);
        return { statusId, comments: enriched, total, safePage, totalPages };
      }),
    );
    for (const b of blocks) {
      commentByStatusId.set(b.statusId, {
        comments: b.comments,
        total: b.total,
        safePage: b.safePage,
        totalPages: b.totalPages,
      });
    }
  }

  const likeCountById = new Map<string, number>();
  const likedByViewer = new Set<string>();
  if (statusIds.length > 0) {
    const [grouped, mine] = await Promise.all([
      prisma.statusLike.groupBy({
        by: ["statusId"],
        where: { statusId: { in: statusIds } },
        _count: { _all: true },
      }),
      viewerId
        ? prisma.statusLike.findMany({
            where: { userId: viewerId, statusId: { in: statusIds } },
            select: { statusId: true },
          })
        : Promise.resolve([]),
    ]);
    for (const g of grouped) {
      likeCountById.set(g.statusId, g._count._all);
    }
    for (const m of mine) {
      likedByViewer.add(m.statusId);
    }
  }

  const followState =
    viewerId && viewerId !== member.id
      ? viewerFollows?.status === "ACCEPTED"
        ? "following"
        : viewerFollows?.status === "PENDING"
          ? "pending"
          : "none"
      : "none";

  const profilePath = `/${member.memberSlug ?? slug}`;
  const profileHrefCurrent = buildMemberProfileHref(profilePath, searchParams, {});
  const shareProfileUrl = `${requestOrigin()}${profilePath}`;

  const statusIdxFrom = statusTotal === 0 ? 0 : (safeStatusPage - 1) * statusPageSize + 1;
  const statusIdxTo = Math.min(safeStatusPage * statusPageSize, statusTotal);

  const timelinePaginationNav =
    statusTotalPages > 1 ? (
      <nav
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-broker-border/60 bg-broker-bg/40 px-4 py-3 text-sm"
        aria-label="Pagination linimasa status"
      >
        <span className="text-broker-muted">
          Halaman {safeStatusPage} dari {statusTotalPages}
          {statusTotal > 0 ? (
            <>
              {" "}
              · status {statusIdxFrom}–{statusIdxTo} dari {statusTotal}
            </>
          ) : null}
        </span>
        <div className="flex gap-2">
          {safeStatusPage > 1 ? (
            <Link
              href={buildMemberProfileHref(profilePath, searchParams, {
                stPage: safeStatusPage - 1,
              })}
              className="rounded-lg border border-broker-border px-3 py-1.5 font-medium text-broker-accent hover:bg-broker-surface/40"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span className="rounded-lg border border-broker-border/40 px-3 py-1.5 text-broker-muted/50">
              ← Sebelumnya
            </span>
          )}
          {safeStatusPage < statusTotalPages ? (
            <Link
              href={buildMemberProfileHref(profilePath, searchParams, {
                stPage: safeStatusPage + 1,
              })}
              className="rounded-lg border border-broker-border px-3 py-1.5 font-medium text-broker-accent hover:bg-broker-surface/40"
            >
              Berikutnya →
            </Link>
          ) : (
            <span className="rounded-lg border border-broker-border/40 px-3 py-1.5 text-broker-muted/50">
              Berikutnya →
            </span>
          )}
        </div>
      </nav>
    ) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-5 sm:pb-12 sm:pt-8 md:px-6 md:pt-10">
      <nav className="flex items-center gap-2 text-xs text-broker-muted" aria-label="Breadcrumb">
        <Link href="/" className="text-broker-accent transition hover:underline">
          ← Home
        </Link>
        <span className="text-broker-muted/60" aria-hidden>
          /
        </span>
        <span className="truncate">Member</span>
      </nav>

      <div className="mt-6 flex flex-col gap-6 sm:mt-8 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start md:flex-col md:items-center">
          <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-broker-accent/40 bg-broker-surface shadow-lg shadow-black/20 sm:mx-0 sm:h-24 sm:w-24">
            {member.image?.startsWith("/") ? (
              <Image src={member.image} alt="" fill className="object-cover" unoptimized />
            ) : member.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL eksternal di luar remotePatterns next/image
              <img src={member.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-broker-muted">
                {(member.name ?? "M").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {!isSelf && (
            <div className="flex w-full justify-center sm:justify-start md:w-full md:justify-center">
              <Link
                href={chatHref ?? "/"}
                className="inline-flex rounded-lg bg-broker-accent/15 px-3 py-1.5 text-center text-xs font-semibold text-broker-accent transition hover:bg-broker-accent/25"
              >
                Chat
              </Link>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center space-y-1 text-center md:items-start md:text-left">
          <h1 className="text-balance text-xl font-bold tracking-tight text-white sm:text-2xl">{member.name}</h1>
          {member.kabupaten ? (
            <p className="text-sm text-broker-muted">{member.kabupaten}</p>
          ) : null}
          <MemberFollowStatsLinks
            memberUserId={member.id}
            followerCount={followerCount}
            followingCount={followingCount}
            className="justify-center md:justify-start"
          />
          <MemberSocialLinks
            tiktokUrl={member.socialTiktokUrl}
            instagramUrl={member.socialInstagramUrl}
            facebookUrl={member.socialFacebookUrl}
            telegramUrl={member.socialTelegramUrl}
            youtubeUrl={member.socialYoutubeUrl}
            className="mt-2 justify-center md:justify-start"
          />
          {!isSelf && viewerId && (
            <div className="flex w-full justify-center md:justify-start">
              <MemberFollowButton
                memberId={member.id}
                followState={followState}
                targetRequiresApproval={member.followApprovalMode === "APPROVAL_REQUIRED"}
              />
            </div>
          )}
          {!isSelf && !viewerId && (
            <div className="flex w-full justify-center md:justify-start">
              <MemberFollowLoginLink loginCallbackUrl={profileHrefCurrent} />
            </div>
          )}
          <MemberProfileShare
            variant="belowFollow"
            shareUrl={shareProfileUrl}
            shareTitle={member.name ?? "Member GMR FX"}
          />
        </div>
      </div>

      <section className="mt-10 sm:mt-12">
        {isSelf && (
          <div className="mb-8 sm:mb-10">
            <MemberStatusComposer />
          </div>
        )}

        {!viewerId && (
          <p className="mt-5 rounded-xl border border-broker-border/60 bg-broker-surface/25 px-4 py-3 text-sm text-broker-muted sm:px-5">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(profileHrefCurrent)}`}
              className="font-medium text-broker-accent hover:underline"
            >
              Login
            </Link>{" "}
            untuk berkomentar pada status.
          </p>
        )}

        <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
          {statuses.map((s) => {
            const block = commentByStatusId.get(s.id);
            const list = block?.comments ?? [];
            const cps = commentPageSize;
            const from =
              block && block.total > 0 ? (block.safePage - 1) * cps + 1 : 0;
            const to = block ? Math.min(block.safePage * cps, block.total) : 0;
            return (
              <article
                key={s.id}
                className="rounded-2xl border border-broker-border/80 bg-broker-surface/25 p-4 shadow-sm md:p-5"
              >
                <div className="flex gap-3">
                  <SmallUserAvatar name={member.name} image={member.image} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <time
                        dateTime={s.createdAt.toISOString()}
                        className="text-xs text-broker-muted"
                      >
                        {formatJakarta(s.createdAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                      {isSelf && viewerId && <DeleteStatusButton statusId={s.id} />}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white">{s.content}</p>

                    {viewerId ? (
                      <MemberStatusActions
                        statusId={s.id}
                        initialCount={likeCountById.get(s.id) ?? 0}
                        initialLiked={likedByViewer.has(s.id)}
                      />
                    ) : (
                      <p className="mt-3 text-xs text-broker-muted">
                        <span>{likeCountById.get(s.id) ?? 0} suka</span>
                        {" · "}
                        <Link
                          href={`/login?callbackUrl=${encodeURIComponent(profileHrefCurrent)}`}
                          className="text-broker-accent hover:underline"
                        >
                          Login untuk menyukai
                        </Link>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-broker-border/50 pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-broker-accent/90">
                    Komentar
                  </h3>
                  {list.length > 0 ? (
                    <ul className="mt-3 space-y-3">
                      {list.map((c) => {
                        const canDeleteComment =
                          viewerId != null && (viewerId === c.userId || viewerId === member.id);
                        return (
                          <li
                            key={c.id}
                            className="flex gap-2.5 rounded-xl border border-broker-border/60 bg-broker-bg/80 py-2.5 pl-2 pr-3 text-sm"
                          >
                            <SmallUserAvatar
                              name={c.user.name}
                              image={c.user.image}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium leading-tight text-broker-accent">
                                  {c.user.name ?? "Member"}
                                </p>
                                {canDeleteComment && (
                                  <DeleteStatusCommentButton commentId={c.id} />
                                )}
                              </div>
                              <StatusCommentBody
                                content={c.content}
                                mentionsBySlug={c.mentionsBySlug}
                                className="mt-0.5 whitespace-pre-wrap text-broker-muted"
                              />
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <p className="text-[11px] text-broker-muted/60">
                                  {formatJakarta(c.createdAt, {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </p>
                                {viewerId ? (
                                  <MemberStatusCommentLikeButton
                                    commentId={c.id}
                                    initialCount={c.likeCount}
                                    initialLiked={c.isLiked}
                                  />
                                ) : (
                                  c.likeCount > 0 && (
                                    <span className="text-[11px] text-broker-muted/70">
                                      {c.likeCount} suka
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-broker-muted">Belum ada komentar.</p>
                  )}
                  {block && block.total > 0 && (
                    <div className="mt-4 rounded-lg border border-broker-border/50 bg-broker-bg/30 px-3 py-2.5">
                      <p className="text-xs text-broker-muted">
                        Menampilkan {from}–{to} dari {block.total} komentar
                        {block.totalPages > 1
                          ? ` · halaman ${block.safePage} dari ${block.totalPages}`
                          : null}
                      </p>
                      {block.totalPages > 1 && (
                        <nav
                          className="mt-2 flex flex-wrap items-center gap-2"
                          aria-label="Pagination komentar"
                        >
                          {block.safePage > 1 ? (
                            <Link
                              href={buildMemberProfileHref(profilePath, searchParams, {
                                setCommentPage: { statusId: s.id, page: block.safePage - 1 },
                              })}
                              className="rounded-lg border border-broker-border px-3 py-1.5 text-xs font-medium text-broker-accent hover:bg-broker-surface/40"
                            >
                              ← Sebelumnya
                            </Link>
                          ) : (
                            <span className="rounded-lg border border-broker-border/40 px-3 py-1.5 text-xs text-broker-muted/50">
                              ← Sebelumnya
                            </span>
                          )}
                          {block.safePage < block.totalPages ? (
                            <Link
                              href={buildMemberProfileHref(profilePath, searchParams, {
                                setCommentPage: { statusId: s.id, page: block.safePage + 1 },
                              })}
                              className="rounded-lg border border-broker-border px-3 py-1.5 text-xs font-medium text-broker-accent hover:bg-broker-surface/40"
                            >
                              Berikutnya →
                            </Link>
                          ) : (
                            <span className="rounded-lg border border-broker-border/40 px-3 py-1.5 text-xs text-broker-muted/50">
                              Berikutnya →
                            </span>
                          )}
                        </nav>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {statuses.length === 0 && (
            <p className="text-sm text-broker-muted">
              {isSelf
                ? "Belum ada status. Tulis pembaruan di kotak di atas agar teman bisa menyapa."
                : "Member ini belum membagikan status."}
            </p>
          )}
        </div>

        {timelinePaginationNav && (
          <div className="mt-8 border-t border-broker-border/50 pt-6">{timelinePaginationNav}</div>
        )}
      </section>

      <section className="mt-10 border-t border-broker-border/40 pt-10 sm:mt-12 sm:pt-12">
        <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">Artikel</h2>
        <ul className="mt-4 space-y-3 sm:mt-5">
          {articles.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-broker-border/80 bg-broker-surface/25 p-4 transition hover:border-broker-border sm:p-5"
            >
              <Link href={`/artikel/${a.slug}`} className="text-broker-accent hover:underline">
                {a.title}
              </Link>
              {a.excerpt && <p className="mt-2 text-sm text-broker-muted">{a.excerpt}</p>}
            </li>
          ))}
          {articles.length === 0 && <li className="text-sm text-broker-muted">Belum ada artikel.</li>}
        </ul>
      </section>
    </div>
  );
}
