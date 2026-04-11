import type { PrismaClient } from "@prisma/client";
import {
  extractUserMentionSlugsFromText,
  resolveMentionProfilesBySlug,
  type MentionProfile,
} from "@/lib/statusCommentMentions";

type RawStatusComment = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
};

export type EnrichedStatusComment = RawStatusComment & {
  likeCount: number;
  isLiked: boolean;
  /** Slug → profil untuk token `{@user:slug}` */
  mentionsBySlug: Record<string, MentionProfile>;
};

export async function enrichStatusComments(
  prisma: PrismaClient,
  rows: RawStatusComment[],
  viewerUserId: string | null
): Promise<EnrichedStatusComment[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const allSlugs = rows.flatMap((r) => extractUserMentionSlugsFromText(r.content));

  const [grouped, viewerLikes] = await Promise.all([
    prisma.commentLike.groupBy({
      by: ["commentId"],
      where: { commentId: { in: ids } },
      _count: { _all: true },
    }),
    viewerUserId
      ? prisma.commentLike.findMany({
          where: { userId: viewerUserId, commentId: { in: ids } },
          select: { commentId: true },
        })
      : Promise.resolve([]),
  ]);

  const countByComment = new Map(grouped.map((g) => [g.commentId, g._count._all]));
  const likedSet = new Set(viewerLikes.map((x) => x.commentId));

  const slugMap = await resolveMentionProfilesBySlug(prisma, allSlugs);

  return rows.map((r) => {
    const mentionsBySlug: Record<string, MentionProfile> = {};
    for (const slug of extractUserMentionSlugsFromText(r.content)) {
      const p = slugMap.get(slug);
      if (p) mentionsBySlug[slug] = p;
    }
    return {
      ...r,
      likeCount: countByComment.get(r.id) ?? 0,
      isLiked: likedSet.has(r.id),
      mentionsBySlug,
    };
  });
}
