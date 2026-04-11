import { Prisma } from "@prisma/client";
import type { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaPgColumnExistsPublic } from "@/lib/prismaPgColumnExists";

/** Penulis untuk kartu berita (beranda / daftar berita). */
export const homeNewsAuthorCardSelect = {
  id: true,
  name: true,
  memberSlug: true,
} as const;

export type HomeNewsItemWithAuthorCard = PrismaNamespace.HomeNewsItemGetPayload<{
  select: {
    id: true;
    scope: true;
    title: true;
    slug: true;
    excerpt: true;
    contentHtml: true;
    imageUrl: true;
    imageSourceUrl: true;
    sourceUrl: true;
    sourceName: true;
    status: true;
    publishedAt: true;
    authorId: true;
    createdAt: true;
    updatedAt: true;
    author: { select: typeof homeNewsAuthorCardSelect };
  };
}>;

const scalarSelectWithImageSource = {
  id: true,
  scope: true,
  title: true,
  slug: true,
  excerpt: true,
  contentHtml: true,
  imageUrl: true,
  imageSourceUrl: true,
  sourceUrl: true,
  sourceName: true,
  status: true,
  publishedAt: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const scalarSelectCompat = {
  id: true,
  scope: true,
  title: true,
  slug: true,
  excerpt: true,
  contentHtml: true,
  imageUrl: true,
  sourceUrl: true,
  sourceName: true,
  status: true,
  publishedAt: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} as const;

function selectWithAuthorCardFull() {
  return {
    ...scalarSelectWithImageSource,
    author: { select: homeNewsAuthorCardSelect },
  };
}

function selectWithAuthorCardCompat() {
  return {
    ...scalarSelectCompat,
    author: { select: homeNewsAuthorCardSelect },
  };
}

function normalizeHomeNewsWithAuthorCard(row: Record<string, unknown>): HomeNewsItemWithAuthorCard {
  const imageSourceUrl =
    "imageSourceUrl" in row && row.imageSourceUrl !== undefined
      ? (row.imageSourceUrl as string | null)
      : null;
  return { ...row, imageSourceUrl } as HomeNewsItemWithAuthorCard;
}

async function homeNewsSelectWithAuthorCard() {
  const hasCol = await prismaPgColumnExistsPublic("HomeNewsItem", "imageSourceUrl");
  return hasCol ? selectWithAuthorCardFull() : selectWithAuthorCardCompat();
}

export async function findManyHomeNewsWithAuthorCard(
  args: Omit<Prisma.HomeNewsItemFindManyArgs, "select" | "include">
): Promise<HomeNewsItemWithAuthorCard[]> {
  const select = await homeNewsSelectWithAuthorCard();
  const rows = await prisma.homeNewsItem.findMany({ ...args, select });
  return rows.map((r) => normalizeHomeNewsWithAuthorCard(r as Record<string, unknown>));
}

export async function findFirstHomeNewsWithAuthorCard(
  args: Omit<Prisma.HomeNewsItemFindFirstArgs, "select" | "include">
): Promise<HomeNewsItemWithAuthorCard | null> {
  const select = await homeNewsSelectWithAuthorCard();
  const row = await prisma.homeNewsItem.findFirst({ ...args, select });
  if (!row) return null;
  return normalizeHomeNewsWithAuthorCard(row as Record<string, unknown>);
}
