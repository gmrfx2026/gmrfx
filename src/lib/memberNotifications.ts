import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toMemberSlug } from "@/lib/memberSlug";

export async function getMemberPublicPath(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberSlug: true, name: true, id: true },
  });
  if (!u) return null;
  const slug = u.memberSlug ?? toMemberSlug(u.name, u.id);
  return `/${slug}`;
}

export async function notifyFollowersNewStatus(params: {
  authorId: string;
  statusId: string;
  contentPreview: string;
}): Promise<void> {
  const path = await getMemberPublicPath(params.authorId);
  if (!path) return;

  const author = await prisma.user.findUnique({
    where: { id: params.authorId },
    select: { name: true },
  });
  const name = author?.name ?? "Member";
  const preview = params.contentPreview.trim();
  const body =
    preview.length > 120 ? `${preview.slice(0, 120)}…` : preview || "Status baru";

  const followers = await prisma.memberFollow.findMany({
    where: { followingId: params.authorId, status: "ACCEPTED" },
    select: { followerId: true },
  });
  if (followers.length === 0) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({
      userId: f.followerId,
      actorId: params.authorId,
      type: NotificationType.NEW_STATUS,
      title: `${name} memposting status`,
      body,
      linkUrl: path,
      statusId: params.statusId,
    })),
  });
}

export async function notifyFollowersNewArticle(params: {
  authorId: string;
  articleId: string;
  title: string;
  slug: string;
}): Promise<void> {
  const followers = await prisma.memberFollow.findMany({
    where: { followingId: params.authorId, status: "ACCEPTED" },
    select: { followerId: true },
  });
  if (followers.length === 0) return;

  const author = await prisma.user.findUnique({
    where: { id: params.authorId },
    select: { name: true },
  });
  const name = author?.name ?? "Member";
  const linkUrl = `/artikel/${params.slug}`;
  const titleShort =
    params.title.length > 80 ? `${params.title.slice(0, 80)}…` : params.title;

  await prisma.notification.createMany({
    data: followers.map((f) => ({
      userId: f.followerId,
      actorId: params.authorId,
      type: NotificationType.NEW_ARTICLE,
      title: `${name} menerbitkan artikel`,
      body: titleShort,
      linkUrl,
      articleId: params.articleId,
    })),
  });
}
