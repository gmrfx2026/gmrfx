import { Prisma } from "@prisma/client";
import type { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Hindari `instanceof` pada error Prisma — lihat `homeNewsItemFetch.ts`. */
function isMissingCoverImageUrlColumn(e: unknown): boolean {
  if (e == null || typeof e !== "object") return false;
  const err = e as { code?: string; message?: string; meta?: Record<string, unknown> };
  if (err.code !== "P2022") return false;
  if (String(err.message ?? "").includes("coverImageUrl")) return true;
  const col =
    typeof err.meta?.column === "string"
      ? err.meta.column
      : typeof err.meta?.field_name === "string"
        ? err.meta.field_name
        : "";
  return col.includes("coverImageUrl");
}

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
  try {
    const rows = await prisma.sharedIndicator.findMany({ ...args, select: homeSelectWithCover });
    return rows as SharedIndicatorHomeRow[];
  } catch (e) {
    if (!isMissingCoverImageUrlColumn(e)) throw e;
    const rows = await prisma.sharedIndicator.findMany({ ...args, select: homeSelectCompat });
    return rows.map((r) => ({ ...r, coverImageUrl: null }) as SharedIndicatorHomeRow);
  }
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
  try {
    const rows = await prisma.sharedIndicator.findMany({ ...args, select: catalogSelectWithCover });
    return rows as SharedIndicatorCatalogRow[];
  } catch (e) {
    if (!isMissingCoverImageUrlColumn(e)) throw e;
    const rows = await prisma.sharedIndicator.findMany({ ...args, select: catalogSelectCompat });
    return rows.map((r) => ({ ...r, coverImageUrl: null }) as SharedIndicatorCatalogRow);
  }
}
