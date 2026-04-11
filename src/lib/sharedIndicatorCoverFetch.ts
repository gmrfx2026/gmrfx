import { Prisma } from "@prisma/client";
import type { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaPgColumnExistsPublic } from "@/lib/prismaPgColumnExists";

const homeSelectWithCover = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceIdr: true,
  platform: true,
  coverImageUrl: true,
  seller: { select: { name: true } },
} as const;

const homeSelectCompat = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceIdr: true,
  platform: true,
  seller: { select: { name: true } },
} as const;

export type SharedIndicatorHomeRow = PrismaNamespace.SharedIndicatorGetPayload<{
  select: typeof homeSelectWithCover;
}>;

export async function findManySharedIndicatorsForHome(
  args: Omit<Prisma.SharedIndicatorFindManyArgs, "select" | "include">
): Promise<SharedIndicatorHomeRow[]> {
  const hasCol = await prismaPgColumnExistsPublic("SharedIndicator", "coverImageUrl");
  const select = hasCol ? homeSelectWithCover : homeSelectCompat;
  const rows = await prisma.sharedIndicator.findMany({ ...args, select });
  return rows.map((r) =>
    hasCol ? (r as SharedIndicatorHomeRow) : ({ ...r, coverImageUrl: null } as SharedIndicatorHomeRow)
  );
}

const catalogSelectWithCover = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceIdr: true,
  platform: true,
  coverImageUrl: true,
  updatedAt: true,
  seller: { select: { id: true, name: true, memberSlug: true } },
} as const;

const catalogSelectCompat = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceIdr: true,
  platform: true,
  updatedAt: true,
  seller: { select: { id: true, name: true, memberSlug: true } },
} as const;

export type SharedIndicatorCatalogRow = PrismaNamespace.SharedIndicatorGetPayload<{
  select: typeof catalogSelectWithCover;
}>;

export async function findManySharedIndicatorsForCatalog(
  args: Omit<Prisma.SharedIndicatorFindManyArgs, "select" | "include">
): Promise<SharedIndicatorCatalogRow[]> {
  const hasCol = await prismaPgColumnExistsPublic("SharedIndicator", "coverImageUrl");
  const select = hasCol ? catalogSelectWithCover : catalogSelectCompat;
  const rows = await prisma.sharedIndicator.findMany({ ...args, select });
  return rows.map((r) =>
    hasCol ? (r as SharedIndicatorCatalogRow) : ({ ...r, coverImageUrl: null } as SharedIndicatorCatalogRow)
  );
}
