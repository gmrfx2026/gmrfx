import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/** Kunci stabil — href & aturan tampil ditentukan di kode (admin tidak mengubah URL). */
export const SITE_HEADER_NAV_KEYS = [
  "home",
  "artikel",
  "indikator",
  "ea",
  "penawaran",
  "berita",
  "cari",
  "galeri",
  "daftar",
  "login",
  "dashboard",
  "admin",
] as const;

export type SiteHeaderNavKey = (typeof SITE_HEADER_NAV_KEYS)[number];

export type SiteHeaderNavResolvedItem = {
  key: SiteHeaderNavKey;
  href: string;
  label: string;
  /** Tautan Admin: gaya emas di header. */
  adminAccent: boolean;
};

type Visibility = "always" | "guest_only" | "logged_in" | "admin_only";

const KEY_META: Record<SiteHeaderNavKey, { href: string; visibility: Visibility }> = {
  home: { href: "/", visibility: "always" },
  artikel: { href: "/artikel", visibility: "always" },
  indikator: { href: "/indikator", visibility: "always" },
  ea: { href: "/ea", visibility: "always" },
  penawaran: { href: "/penawaran", visibility: "always" },
  berita: { href: "/berita", visibility: "always" },
  cari: { href: "/cari", visibility: "always" },
  galeri: { href: "/galeri", visibility: "always" },
  daftar: { href: "/daftar", visibility: "guest_only" },
  login: { href: "/login", visibility: "guest_only" },
  dashboard: { href: "/profil", visibility: "logged_in" },
  admin: { href: "/admin", visibility: "admin_only" },
};

const DEFAULTS: Record<SiteHeaderNavKey, { label: string; sortOrder: number }> = {
  home: { label: "Home", sortOrder: 0 },
  artikel: { label: "Artikel", sortOrder: 1 },
  indikator: { label: "Indikator", sortOrder: 2 },
  ea: { label: "EA", sortOrder: 3 },
  penawaran: { label: "Penawaran", sortOrder: 4 },
  berita: { label: "Berita", sortOrder: 5 },
  cari: { label: "Cari", sortOrder: 6 },
  galeri: { label: "Galeri", sortOrder: 7 },
  daftar: { label: "Daftar", sortOrder: 8 },
  login: { label: "Login", sortOrder: 9 },
  dashboard: { label: "Dashboard", sortOrder: 10 },
  admin: { label: "Admin", sortOrder: 11 },
};

function isNavKey(s: string): s is SiteHeaderNavKey {
  return (SITE_HEADER_NAV_KEYS as readonly string[]).includes(s);
}

function visibilityAllows(vis: Visibility, session: Session | null): boolean {
  const loggedIn = Boolean(session?.user?.id);
  const isAdmin = session?.user?.role === "ADMIN";
  switch (vis) {
    case "always":
      return true;
    case "guest_only":
      return !loggedIn;
    case "logged_in":
      return loggedIn;
    case "admin_only":
      return isAdmin;
    default:
      return false;
  }
}

/** Item menu header untuk sesi saat ini (sudah difilter & diurutkan). */
export async function getResolvedSiteHeaderNavItems(
  session: Session | null
): Promise<SiteHeaderNavResolvedItem[]> {
  const rows = await prisma.siteHeaderNavItem.findMany();
  const byKey = new Map(rows.map((r) => [r.navKey, r]));

  const withOrder: {
    key: SiteHeaderNavKey;
    href: string;
    label: string;
    sortOrder: number;
    adminAccent: boolean;
  }[] = [];

  for (const key of SITE_HEADER_NAV_KEYS) {
    const meta = KEY_META[key];
    if (!visibilityAllows(meta.visibility, session)) continue;

    const row = byKey.get(key);
    if (row && !row.enabled) continue;

    const def = DEFAULTS[key];
    const label = (row?.label ?? def.label).trim() || def.label;
    const sortOrder = row?.sortOrder ?? def.sortOrder;

    withOrder.push({
      key,
      href: meta.href,
      label,
      sortOrder,
      adminAccent: key === "admin",
    });
  }

  withOrder.sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));

  return withOrder.map(({ sortOrder: _s, ...rest }) => rest);
}

export type SiteHeaderNavAdminRow = {
  navKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
  href: string;
  visibilityNote: string;
};

const VIS_NOTE: Record<Visibility, string> = {
  always: "Semua pengunjung",
  guest_only: "Hanya jika belum login",
  logged_in: "Hanya setelah login",
  admin_only: "Hanya admin",
};

export async function getSiteHeaderNavAdminRows(): Promise<SiteHeaderNavAdminRow[]> {
  const rows = await prisma.siteHeaderNavItem.findMany();
  const byKey = new Map(rows.map((r) => [r.navKey, r]));

  return SITE_HEADER_NAV_KEYS.map((key) => {
    const meta = KEY_META[key];
    const def = DEFAULTS[key];
    const row = byKey.get(key);
    return {
      navKey: key,
      label: row?.label ?? def.label,
      sortOrder: row?.sortOrder ?? def.sortOrder,
      enabled: row?.enabled ?? true,
      href: meta.href,
      visibilityNote: VIS_NOTE[meta.visibility],
    };
  });
}

export type SiteHeaderNavAdminPayload = {
  navKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
}[];

export async function saveSiteHeaderNavFromAdmin(payload: SiteHeaderNavAdminPayload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Payload tidak valid");
  }

  const seen = new Set<string>();
  for (const item of payload) {
    if (!item || typeof item.navKey !== "string" || !isNavKey(item.navKey)) {
      throw new Error(`navKey tidak diizinkan: ${String(item?.navKey)}`);
    }
    if (seen.has(item.navKey)) throw new Error(`Duplikat navKey: ${item.navKey}`);
    seen.add(item.navKey);

    const label = String(item.label ?? "").trim();
    if (!label || label.length > 80) {
      throw new Error("Label wajib dan maks. 80 karakter");
    }

    const sortOrder = Number(item.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999) {
      throw new Error("Urutan harus angka 0–999");
    }

    if (typeof item.enabled !== "boolean") {
      throw new Error("enabled harus boolean");
    }
  }

  if (seen.size !== SITE_HEADER_NAV_KEYS.length) {
    throw new Error("Semua item menu wajib dikirim");
  }

  const enabledAlways = payload.filter((i) => {
    if (!isNavKey(i.navKey) || !i.enabled) return false;
    return KEY_META[i.navKey].visibility === "always";
  });
  if (enabledAlways.length < 1) {
    throw new Error("Minimal satu item untuk semua pengunjung harus tetap aktif");
  }

  for (const item of payload) {
    if (!isNavKey(item.navKey)) continue;
    const label = String(item.label ?? "").trim();
    const sortOrder = Number(item.sortOrder);
    await prisma.siteHeaderNavItem.upsert({
      where: { navKey: item.navKey },
      create: {
        navKey: item.navKey,
        label,
        sortOrder,
        enabled: item.enabled,
      },
      update: { label, sortOrder, enabled: item.enabled },
    });
  }
}
