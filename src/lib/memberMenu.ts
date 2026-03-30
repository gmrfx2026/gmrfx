import { prisma } from "@/lib/prisma";

export const MEMBER_MENU_TAB_KEYS = [
  "home",
  "artikel",
  "indikator",
  "expert",
  "portfolio",
  "notifications",
  "wallet",
  "chat",
  "security",
] as const;

export type MemberMenuTabKey = (typeof MEMBER_MENU_TAB_KEYS)[number];

export type MemberMenuResolvedItem = {
  key: string;
  label: string;
  href: string;
};

const DEFAULTS: Record<MemberMenuTabKey, { label: string; sortOrder: number }> = {
  home: { label: "Home", sortOrder: 0 },
  artikel: { label: "Artikel", sortOrder: 1 },
  indikator: { label: "Indikator", sortOrder: 2 },
  expert: { label: "Expert Advisor (EA)", sortOrder: 3 },
  portfolio: { label: "Portofolio", sortOrder: 4 },
  notifications: { label: "Notifikasi", sortOrder: 5 },
  wallet: { label: "Wallet & Transfer", sortOrder: 6 },
  chat: { label: "Chat", sortOrder: 7 },
  security: { label: "Keamanan", sortOrder: 8 },
};

function isTabKey(s: string): s is MemberMenuTabKey {
  return (MEMBER_MENU_TAB_KEYS as readonly string[]).includes(s);
}

/** Menu untuk sidebar member: gabungan default + override DB (label, urutan, aktif). */
export async function getResolvedMemberMenuItems(): Promise<MemberMenuResolvedItem[]> {
  const rows = await prisma.memberMenuItem.findMany();
  const byKey = new Map(rows.map((r) => [r.tabKey, r]));

  const withOrder: { key: MemberMenuTabKey; label: string; href: string; sortOrder: number }[] = [];

  for (const tabKey of MEMBER_MENU_TAB_KEYS) {
    const def = DEFAULTS[tabKey];
    const row = byKey.get(tabKey);
    if (row && !row.enabled) continue;
    let label = (row?.label ?? def.label).trim() || def.label;
    // Bekas salah ketik di admin: label "Surat" pada tab chat (menu surat sudah dihapus).
    if (tabKey === "chat" && /^surat$/i.test(label)) {
      label = def.label;
    }
    const sortOrder = row?.sortOrder ?? def.sortOrder;
    const href = tabKey === "portfolio" ? "/profil/portfolio" : `/profil?tab=${tabKey}`;
    withOrder.push({
      key: tabKey,
      label,
      href,
      sortOrder,
    });
  }

  withOrder.sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
  const allowed = new Set<string>(MEMBER_MENU_TAB_KEYS);
  return withOrder
    .filter((x) => allowed.has(x.key))
    .map(({ sortOrder: _s, ...rest }) => rest);
}

/** Daftar lengkap untuk form admin (satu baris per tab, termasuk yang nonaktif). */
export async function getMemberMenuAdminRows() {
  const rows = await prisma.memberMenuItem.findMany();
  const byKey = new Map(rows.map((r) => [r.tabKey, r]));

  return MEMBER_MENU_TAB_KEYS.map((tabKey) => {
    const def = DEFAULTS[tabKey];
    const row = byKey.get(tabKey);
    return {
      tabKey,
      label: row?.label ?? def.label,
      sortOrder: row?.sortOrder ?? def.sortOrder,
      enabled: row?.enabled ?? true,
    };
  });
}

export type MemberMenuAdminPayload = {
  tabKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
}[];

export async function saveMemberMenuFromAdmin(payload: MemberMenuAdminPayload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("Payload tidak valid");
  }

  const seen = new Set<string>();
  for (const item of payload) {
    if (!item || typeof item.tabKey !== "string" || !isTabKey(item.tabKey)) {
      throw new Error(`tabKey tidak diizinkan: ${String(item?.tabKey)}`);
    }
    if (seen.has(item.tabKey)) throw new Error(`Duplikat tabKey: ${item.tabKey}`);
    seen.add(item.tabKey);

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

  const enabledCount = payload.filter((i) => i.enabled).length;
  if (enabledCount < 1) {
    throw new Error("Minimal satu item menu harus aktif");
  }

  if (seen.size !== MEMBER_MENU_TAB_KEYS.length) {
    throw new Error("Semua item menu wajib dikirim");
  }

  for (const item of payload) {
    const label = String(item.label ?? "").trim();
    const sortOrder = Number(item.sortOrder);
    await prisma.memberMenuItem.upsert({
      where: { tabKey: item.tabKey },
      create: {
        tabKey: item.tabKey,
        label,
        sortOrder,
        enabled: item.enabled,
      },
      update: { label, sortOrder, enabled: item.enabled },
    });
  }
}

