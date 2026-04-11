import { Prisma } from "@prisma/client";
import type { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

function isMissingImageSourceUrlColumn(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2022") return false;
  const msg = e.message;
  if (msg.includes("imageSourceUrl")) return true;
  const meta = e.meta as { column?: string; field_name?: string } | undefined;
  const col = meta?.column ?? meta?.field_name;
  return typeof col === "string" && col.includes("imageSourceUrl");
}

function normalizeHomeNewsWithAuthorCard(row: Record<string, unknown>): HomeNewsItemWithAuthorCard {
  const imageSourceUrl =
    "imageSourceUrl" in row && row.imageSourceUrl !== undefined
      ? (row.imageSourceUrl as string | null)
      : null;
  return { ...row, imageSourceUrl } as HomeNewsItemWithAuthorCard;
}

export async function findManyHomeNewsWithAuthorCard(
  args: Omit<Prisma.HomeNewsItemFindManyArgs, "select" | "include">
): Promise<HomeNewsItemWithAuthorCard[]> {
  try {
    const rows = await prisma.homeNewsItem.findMany({
      ...args,
      select: selectWithAuthorCardFull(),
    });
    return rows as HomeNewsItemWithAuthorCard[];
  } catch (e) {
    if (!isMissingImageSourceUrlColumn(e)) throw e;
    const rows = await prisma.homeNewsItem.findMany({
      ...args,
      select: selectWithAuthorCardCompat(),
    });
    return rows.map((r) => normalizeHomeNewsWithAuthorCard(r as Record<string, unknown>));
  }
}

export async function findFirstHomeNewsWithAuthorCard(
  args: Omit<Prisma.HomeNewsItemFindFirstArgs, "select" | "include">
): Promise<HomeNewsItemWithAuthorCard | null> {
  try {
    const row = await prisma.homeNewsItem.findFirst({
      ...args,
      select: selectWithAuthorCardFull(),
    });
    return row as HomeNewsItemWithAuthorCard | null;
  } catch (e) {
    if (!isMissingImageSourceUrlColumn(e)) throw e;
    const row = await prisma.homeNewsItem.findFirst({
      ...args,
      select: selectWithAuthorCardCompat(),
    });
    if (!row) return null;
    return normalizeHomeNewsWithAuthorCard(row as Record<string, unknown>);
  }
}
