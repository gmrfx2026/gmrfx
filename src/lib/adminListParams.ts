import { clampPageSize, parsePositiveInt } from "./walletTransferFilters";

const DEFAULT_PAGE_SIZE = 20;

function pickParam(raw: Record<string, string | string[] | undefined>, key: string) {
  const v = raw[key];
  return Array.isArray(v) ? v[0] : v;
}

export type AdminListQuery = {
  page: number;
  pageSize: number;
  q: string;
};

/** Query umum admin: `page`, `perPage`, `q` (tanpa filter tanggal). */
export function parseAdminListQuery(raw: Record<string, string | string[] | undefined>): AdminListQuery {
  const pageSize = clampPageSize(parsePositiveInt(pickParam(raw, "perPage"), DEFAULT_PAGE_SIZE));
  const page = Math.max(1, parsePositiveInt(pickParam(raw, "page"), 1));
  const q = String(pickParam(raw, "q") ?? "").trim().slice(0, 120);
  return { page, pageSize, q };
}

/**
 * Query dengan prefix, mis. member profil: `aPage`, `aPerPage`, `aQ`.
 * @param prefix satu huruf atau string pendek, mis. `"a"` untuk artikel.
 */
export function parsePrefixedListQuery(
  raw: Record<string, string | string[] | undefined>,
  prefix: string
): AdminListQuery {
  const pageSize = clampPageSize(
    parsePositiveInt(pickParam(raw, `${prefix}PerPage`), DEFAULT_PAGE_SIZE)
  );
  const page = Math.max(1, parsePositiveInt(pickParam(raw, `${prefix}Page`), 1));
  const q = String(pickParam(raw, `${prefix}Q`) ?? "").trim().slice(0, 120);
  return { page, pageSize, q };
}

/** Link daftar artikel di `/profil` dengan tab aktif + pagination artikel. */
export function buildProfilArticleListHref(
  profileTab: string,
  opts: { page?: number; perPage?: number; q?: string }
): string {
  const sp = new URLSearchParams();
  const t = profileTab.toLowerCase();
  if (t && t !== "home") sp.set("tab", t);
  if (opts.page != null && opts.page > 1) sp.set("aPage", String(opts.page));
  if (opts.perPage != null && opts.perPage !== DEFAULT_PAGE_SIZE) {
    sp.set("aPerPage", String(opts.perPage));
  }
  if (opts.q) sp.set("aQ", opts.q);
  const qs = sp.toString();
  return `/profil${qs ? `?${qs}` : ""}`;
}

export function resolvePagedWindow(
  requestedPage: number,
  pageSize: number,
  total: number
): { page: number; skip: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const skip = (page - 1) * pageSize;
  return { page, skip, totalPages };
}

export function buildAdminListHref(
  path: string,
  opts: { page?: number; perPage?: number; q?: string; defaultPerPage?: number }
): string {
  const def = opts.defaultPerPage ?? DEFAULT_PAGE_SIZE;
  const sp = new URLSearchParams();
  if (opts.page != null && opts.page > 1) sp.set("page", String(opts.page));
  if (opts.perPage != null && opts.perPage !== def) sp.set("perPage", String(opts.perPage));
  if (opts.q) sp.set("q", opts.q);
  const qs = sp.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}
