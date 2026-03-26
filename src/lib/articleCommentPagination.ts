import { prisma } from "@/lib/prisma";
import { clampPageSize } from "@/lib/walletTransferFilters";

export const ARTICLE_COMMENTS_PER_PAGE_KEY = "article_comments_per_page";

/** Jumlah komentar per halaman di halaman artikel (5–50), default 10. */
export async function getArticleCommentsPerPage(): Promise<number> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY },
  });
  const n = Number.parseInt(String(row?.value ?? "10"), 10);
  if (!Number.isFinite(n) || n < 1) return 10;
  return clampPageSize(n);
}

/** Link ke halaman komentar artikel (`cPage` hanya jika > 1). */
export function buildArtikelCommentPageHref(slug: string, page: number): string {
  const base = `/artikel/${encodeURIComponent(slug)}`;
  if (page <= 1) return base;
  return `${base}?cPage=${page}`;
}

/** Setelah kirim komentar baru, buka halaman terakhir agar komentar terlihat. */
export function buildArtikelCommentLastPageHref(slug: string): string {
  return `/artikel/${encodeURIComponent(slug)}?cPage=last`;
}
