import { prisma } from "@/lib/prisma";
import { clampPageSize, parsePositiveInt } from "@/lib/walletTransferFilters";

export const MEMBER_TIMELINE_PER_PAGE_KEY = "member_timeline_per_page";
export const MEMBER_STATUS_COMMENTS_PER_PAGE_KEY = "member_status_comments_per_page";

export type PageSearchParams = Record<string, string | string[] | undefined>;

/** Next.js 15: `searchParams` bisa Promise; di 14 berupa objek biasa. */
export async function resolvePageSearchParams(
  sp: PageSearchParams | Promise<PageSearchParams> | undefined,
): Promise<PageSearchParams | undefined> {
  if (sp == null) return undefined;
  if (typeof (sp as Promise<PageSearchParams>).then === "function") {
    return await (sp as Promise<PageSearchParams>);
  }
  return sp as PageSearchParams;
}

/** Jumlah status per halaman di halaman publik member (5–50), default 10. */
export async function getMemberTimelinePerPage(): Promise<number> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: MEMBER_TIMELINE_PER_PAGE_KEY },
  });
  const n = Number.parseInt(String(row?.value ?? "10"), 10);
  if (!Number.isFinite(n) || n < 1) return 10;
  return clampPageSize(n);
}

/** Jumlah komentar per status per halaman (5–50), default 10. */
export async function getMemberStatusCommentsPerPage(): Promise<number> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY },
  });
  const n = Number.parseInt(String(row?.value ?? "10"), 10);
  if (!Number.isFinite(n) || n < 1) return 10;
  return clampPageSize(n);
}

const COMMENT_PAGE_PARAM_PREFIX = "c_";

export function commentPageParamKey(statusId: string): string {
  return `${COMMENT_PAGE_PARAM_PREFIX}${statusId}`;
}

export function parseCommentPageForStatus(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  statusId: string,
): number {
  const raw = searchParams?.[commentPageParamKey(statusId)];
  const s = Array.isArray(raw) ? raw[0] : raw;
  const p = parsePositiveInt(s, 1);
  return p < 1 ? 1 : p;
}

function toURLSearchParams(
  current: Record<string, string | string[] | undefined> | undefined,
): URLSearchParams {
  const u = new URLSearchParams();
  if (!current) return u;
  for (const [k, v] of Object.entries(current)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) u.append(k, item);
    } else {
      u.set(k, v);
    }
  }
  return u;
}

/**
 * Bangun URL profil member dengan mempertahankan `stPage` dan `c_<statusId>`,
 * lalu menerapkan patch (mis. ganti halaman linimasa atau halaman komentar satu status).
 */
export function buildMemberProfileHref(
  profilePath: string,
  current: Record<string, string | string[] | undefined> | undefined,
  patch: {
    stPage?: number;
    setCommentPage?: { statusId: string; page: number };
  },
): string {
  const u = toURLSearchParams(current);

  if (patch.stPage !== undefined) {
    if (patch.stPage <= 1) u.delete("stPage");
    else u.set("stPage", String(patch.stPage));
  }

  if (patch.setCommentPage) {
    const { statusId, page } = patch.setCommentPage;
    const key = commentPageParamKey(statusId);
    if (page <= 1) u.delete(key);
    else u.set(key, String(page));
  }

  const qs = u.toString();
  return qs ? `${profilePath}?${qs}` : profilePath;
}
