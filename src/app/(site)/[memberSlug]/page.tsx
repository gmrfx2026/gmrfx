import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, CommentTarget } from "@prisma/client";
import { MemberStatusCommentForm } from "@/components/MemberStatusCommentForm";
import { MemberRatingWidget } from "@/components/member/MemberRatingWidget";

export const dynamic = "force-dynamic";

export default async function MemberBySlugPage({ params }: { params: { memberSlug: string } }) {
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
      : `/login?callbackUrl=${encodeURIComponent(chatPathForViewer)}`;

  const [statuses, comments, articles, ratingRows, myRating] = await Promise.all([
    prisma.statusEntry.findMany({
      where: { userId: member.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    (async () => {
      const ids = (
        await prisma.statusEntry.findMany({
          where: { userId: member.id },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true },
        })
      ).map((s) => s.id);
      if (!ids.length) return [];
      return prisma.comment.findMany({
        where: { targetType: CommentTarget.STATUS, statusId: { in: ids }, hidden: false },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      });
    })(),
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

  const commentByStatusId = new Map<string, any[]>();
  for (const c of comments) {
    const key = c.statusId as string;
    const arr = commentByStatusId.get(key) ?? [];
    arr.push(c);
    commentByStatusId.set(key, arr);
  }

  const ratingCount = ratingRows.length;
  const ratingAvg = ratingCount > 0 ? ratingRows.reduce((s, r) => s + r.stars, 0) / ratingCount : null;
  const myStars = myRating?.stars ?? null;
  const hasStatuses = statuses.length > 0;
  const canRate = viewerId != null && viewerId !== member.id && hasStatuses;

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
              <Image src={member.image} alt="" fill className="object-cover" />
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
                className="w-full rounded-lg bg-broker-surface/60 px-3 py-2 text-sm text-broker-muted cursor-not-allowed"
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
            />
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Status (3 terbaru)</h2>
        <div className="mt-4 space-y-4">
          {statuses.map((s) => {
            const list = commentByStatusId.get(s.id) ?? [];
            return (
              <div key={s.id} className="rounded-xl border border-broker-border bg-broker-surface/30 p-4">
                <p className="text-sm text-broker-muted">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(s.createdAt))}
                </p>
                <p className="mt-2 text-sm text-white whitespace-pre-wrap">{s.content}</p>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-broker-accent">Komentar</h3>
                  {list.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {list.map((c) => (
                        <li key={c.id} className="rounded-lg border border-broker-border bg-broker-bg p-3 text-sm">
                          <p className="text-broker-accent">{c.user.name ?? "Member"}</p>
                          <p className="mt-1 text-broker-muted">{c.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-broker-muted">Belum ada komentar.</p>
                  )}
                </div>

                {session?.user?.id && session.user.id !== member.id && (
                  <MemberStatusCommentForm statusId={s.id} />
                )}
              </div>
            );
          })}
          {statuses.length === 0 && (
            <p className="text-sm text-broker-muted">Member belum pernah menulis status.</p>
          )}
        </div>
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

