import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SmallUserAvatar } from "@/components/SmallUserAvatar";
import { DeleteStatusButton } from "@/components/member/DeleteStatusButton";
import { DeleteStatusCommentButton } from "@/components/member/DeleteStatusCommentButton";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, CommentTarget } from "@prisma/client";
import { MemberStatusActions } from "@/components/MemberStatusActions";
import { MemberStatusComposer } from "@/components/MemberStatusComposer";
import { MemberRatingWidget } from "@/components/member/MemberRatingWidget";
import { unstable_noStore as noStore } from "next/cache";
import {
  buildMemberProfileHref,
  getMemberStatusCommentsPerPage,
  getMemberTimelinePerPage,
  parseCommentPageForStatus,
  resolvePageSearchParams,
  type PageSearchParams,
} from "@/lib/memberStatusPagination";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseStatusPage(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function MemberBySlugPage({
  params,
  searchParams,
}: {
  params: { memberSlug: string };
  searchParams?: { stPage?: string };
}) {
  noStore();
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

  const [statuses, articles, ratingRows, myRating] = await Promise.all([
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
    prisma.memberRating.findMany({
      where: { memberId: member.id },
      select: { stars: true },
    }),
    viewerId
      ? prisma.memberRating.findFirst({
          where: { memberId: member.id, raterId: viewerId },
          select: { stars: true },
        })
      : Promise.resolve(null),
  ]);

  const statusIds = statuses.map((s) => s.id);

  const commentByStatusId = new Map<
    string,
    {
      comments: Awaited<
        ReturnType<
          typeof prisma.comment.findMany<{
            include: { user: { select: { name: true; image: true } } };
          }>
        >
      >;
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
          orderBy: { createdAt: "asc" },
          skip,
          take: commentPageSize,
          include: { user: { select: { name: true, image: true } } },
        });
        return { statusId, comments: rows, total, safePage, totalPages };
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

  const ratingCount = ratingRows.length;
  const ratingAvg = ratingCount > 0 ? ratingRows.reduce((s, r) => s + r.stars, 0) / ratingCount : null;
  const myStars = myRating?.stars ?? null;
  const hasStatuses = statusTotal > 0;
  const canRate = viewerId != null && viewerId !== member.id && hasStatuses;

  const profilePath = `/${member.memberSlug}`;
  const profileHrefCurrent = buildMemberProfileHref(profilePath, searchParams, {});

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xs text-broker-accent hover:underline">
          ← Home
        </Link>
        <span className="text-xs text-broker-muted">· Member</span>
      </div>

      <div className="mt-4 flex flex-col items-start gap-4 md:flex-row md:items-center">
        <div className="flex flex-col items-start gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-broker-accent/40 bg-broker-surface">
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

          <div className="w-full">
            {isSelf ? (
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-lg bg-broker-surface/60 px-3 py-2 text-sm text-broker-muted"
              >
                Chat (dengan diri sendiri)
              </button>
            ) : (
              <Link
                href={chatHref ?? "/"}
                className="block w-full rounded-lg bg-broker-accent/15 px-3 py-2 text-sm font-semibold text-broker-accent hover:bg-broker-accent/20"
              >
                Chat
              </Link>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">{member.name}</h1>
          <p className="text-sm text-broker-muted">{member.kabupaten}</p>
          {hasStatuses && (
            <MemberRatingWidget
              memberId={member.id}
              canRate={canRate}
              myStars={myStars}
              avgStars={ratingAvg}
              ratingCount={ratingCount}
              isSelfView={isSelf}
            />
          )}
        </div>
      </div>

      <section className="mt-12">
        {isSelf && (
          <div className="mb-8 rounded-2xl border border-broker-accent/35 bg-broker-accent/10 p-4 md:p-5">
            <p className="text-sm font-semibold text-white">Halaman publik Anda</p>
            <p className="mt-1 text-sm text-broker-muted">
              Tulis status di bawah — pengunjung melihat linimasa ini, dan member lain bisa berkomentar dan
              menyukai.
            </p>
            <div className="mt-4">
              <MemberStatusComposer />
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-white">Linimasa status</h2>
        <p className="mt-1 text-sm text-broker-muted">
          Pembaruan dari {member.name}; berkomentar setelah login.
        </p>

        {!viewerId && (
          <p className="mt-6 rounded-xl border border-broker-border/60 bg-broker-surface/25 px-4 py-3 text-sm text-broker-muted">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(profileHrefCurrent)}`}
              className="font-medium text-broker-accent hover:underline"
            >
              Login
            </Link>{" "}
            untuk berkomentar pada status.
          </p>
        )}

        {timelinePaginationNav && <div className="mb-4">{timelinePaginationNav}</div>}

        <div className="mt-6 space-y-5">
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
                        {new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(s.createdAt))}
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
                  {block && block.total > 0 && (
                    <div className="mt-2 rounded-lg border border-broker-border/50 bg-broker-bg/30 px-3 py-2.5">
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
                              <p className="mt-0.5 text-broker-muted">{c.content}</p>
                              <p className="mt-1 text-[11px] text-broker-muted/60">
                                {new Intl.DateTimeFormat("id-ID", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }).format(new Date(c.createdAt))}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-broker-muted">Belum ada komentar.</p>
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Artikel</h2>
        <ul className="mt-3 space-y-2">
          {articles.map((a) => (
            <li key={a.id} className="rounded-lg border border-broker-border bg-broker-surface/30 p-4">
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
