import type { Prisma } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

/** Parse YYYY-MM-DD as local calendar date start (00:00:00.000). */
export function parseLocalDateStart(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Inclusive end of local calendar day for YYYY-MM-DD. */
export function parseLocalDateEnd(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function clampPageSize(n: number): number {
  return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, n));
}

export type WalletHistoryListParams = {
  page: number;
  pageSize: number;
  skip: number;
  fromStr: string;
  toStr: string;
  q: string;
  fromDate: Date | null;
  toDate: Date | null;
};

export function parseWalletHistoryListParams(
  raw: Record<string, string | string[] | undefined>,
  keyPrefix: "" | "w" = ""
): WalletHistoryListParams {
  const pageKey = keyPrefix ? "wPage" : "page";
  const sizeKey = keyPrefix ? "wPerPage" : "perPage";
  const fromKey = keyPrefix ? "wFrom" : "from";
  const toKey = keyPrefix ? "wTo" : "to";
  const qKey = keyPrefix ? "wQ" : "q";

  const pick = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const page = Math.max(1, parsePositiveInt(pick(pageKey), 1));
  const pageSize = clampPageSize(parsePositiveInt(pick(sizeKey), DEFAULT_PAGE_SIZE));
  const fromStr = String(pick(fromKey) ?? "").trim();
  const toStr = String(pick(toKey) ?? "").trim();
  const q = String(pick(qKey) ?? "").trim().slice(0, 120);

  const fromDate = parseLocalDateStart(fromStr);
  const toDate = parseLocalDateEnd(toStr);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    fromStr,
    toStr,
    q,
    fromDate,
    toDate,
  };
}

export function memberWalletTransferWhere(
  userId: string,
  opts: { from?: Date | null; to?: Date | null; q?: string }
): Prisma.WalletTransferWhereInput {
  const involved: Prisma.WalletTransferWhereInput = {
    OR: [{ fromUserId: userId }, { toUserId: userId }],
  };

  const createdAt: Prisma.DateTimeFilter = {};
  if (opts.from) createdAt.gte = opts.from;
  if (opts.to) createdAt.lte = opts.to;
  const datePart: Prisma.WalletTransferWhereInput =
    Object.keys(createdAt).length > 0 ? { createdAt } : {};

  const q = opts.q?.trim();
  const searchPart: Prisma.WalletTransferWhereInput | undefined = q
    ? {
        OR: [
          { transactionId: { contains: q, mode: "insensitive" } },
          { note: { contains: q, mode: "insensitive" } },
          {
            AND: [
              { fromUserId: userId },
              {
                toUser: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { walletAddress: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
          {
            AND: [
              { toUserId: userId },
              {
                fromUser: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    { walletAddress: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
        ],
      }
    : undefined;

  const parts: Prisma.WalletTransferWhereInput[] = [involved];
  if (Object.keys(datePart).length) parts.push(datePart);
  if (searchPart) parts.push(searchPart);
  return { AND: parts };
}

export function adminWalletTransferWhere(opts: {
  from?: Date | null;
  to?: Date | null;
  q?: string;
}): Prisma.WalletTransferWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (opts.from) createdAt.gte = opts.from;
  if (opts.to) createdAt.lte = opts.to;
  const datePart: Prisma.WalletTransferWhereInput =
    Object.keys(createdAt).length > 0 ? { createdAt } : {};

  const q = opts.q?.trim();
  const userMatch: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { walletAddress: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const searchPart: Prisma.WalletTransferWhereInput | undefined = q
    ? {
        OR: [
          { transactionId: { contains: q, mode: "insensitive" } },
          { note: { contains: q, mode: "insensitive" } },
          { fromUser: userMatch },
          { toUser: userMatch },
        ],
      }
    : undefined;

  const parts: Prisma.WalletTransferWhereInput[] = [];
  if (Object.keys(datePart).length) parts.push(datePart);
  if (searchPart) parts.push(searchPart);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

/** If from > to, swap so the range is valid for querying. */
export function normalizeDateRange(
  from: Date | null,
  to: Date | null
): { from: Date | null; to: Date | null } {
  if (!from || !to || from.getTime() <= to.getTime()) return { from, to };
  return { from: to, to: from };
}
