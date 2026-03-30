import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const PORTFOLIO_MENU_TAB_KEYS = [
  "dashboard",
  "summary",
  "mt_linked_logins",
  "journal",
  "trade_log",
  "playbook",
  "community_accounts",
  "community_following",
  "community_my_followers",
  "community_publish",
] as const;

export type PortfolioMenuTabKey = (typeof PORTFOLIO_MENU_TAB_KEYS)[number];

/** Konfigurasi untuk `PortfolioSubNav` / strip mobile (serializable ke client). */
export type PortfolioNavConfig = Record<PortfolioMenuTabKey, { enabled: boolean; label: string; sortOrder: number }>;

const DEFAULTS: Record<PortfolioMenuTabKey, { label: string; sortOrder: number }> = {
  dashboard: { label: "Dashboard", sortOrder: 0 },
  summary: { label: "Ringkasan", sortOrder: 10 },
  mt_linked_logins: { label: "Daftar login MT (EA)", sortOrder: 11 },
  journal: { label: "Jurnal", sortOrder: 20 },
  trade_log: { label: "Trade log", sortOrder: 30 },
  playbook: { label: "Playbook", sortOrder: 40 },
  community_accounts: { label: "Akun", sortOrder: 50 },
  community_following: { label: "Mengikuti (copy)", sortOrder: 60 },
  community_my_followers: { label: "Pengikut akun", sortOrder: 65 },
  community_publish: { label: "Publikasi komunitas", sortOrder: 70 },
};

function isTabKey(s: string): s is PortfolioMenuTabKey {
  return (PORTFOLIO_MENU_TAB_KEYS as readonly string[]).includes(s);
}

function buildConfigFromDbRows(rows: { tabKey: string; label: string; sortOrder: number; enabled: boolean }[]) {
  const byKey = new Map(rows.map((r) => [r.tabKey, r]));
  const out = {} as PortfolioNavConfig;

  for (const tabKey of PORTFOLIO_MENU_TAB_KEYS) {
    const def = DEFAULTS[tabKey];
    const row = byKey.get(tabKey);
    const enabled = row?.enabled ?? true;
    let label = (row?.label ?? def.label).trim() || def.label;
    const sortOrder = row?.sortOrder ?? def.sortOrder;
    out[tabKey] = { enabled, label, sortOrder };
  }

  return out;
}

/** Satu kali per request RSC (layout profil + layout portofolio). */
export const getPortfolioNavConfig = cache(async (): Promise<PortfolioNavConfig> => {
  const rows = await prisma.portfolioMenuItem.findMany();
  return buildConfigFromDbRows(rows);
});

export async function getPortfolioMenuAdminRows() {
  const rows = await prisma.portfolioMenuItem.findMany();
  const byKey = new Map(rows.map((r) => [r.tabKey, r]));

  return PORTFOLIO_MENU_TAB_KEYS.map((tabKey) => {
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

export type PortfolioMenuAdminPayload = {
  tabKey: string;
  label: string;
  sortOrder: number;
  enabled: boolean;
}[];

export async function savePortfolioMenuFromAdmin(payload: PortfolioMenuAdminPayload) {
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

  const byKey = new Map(payload.map((i) => [i.tabKey, i]));
  const dash = byKey.get("dashboard");
  if (!dash?.enabled) {
    throw new Error("Menu Dashboard portofolio harus tetap aktif");
  }

  const enabledCount = payload.filter((i) => i.enabled).length;
  if (enabledCount < 1) {
    throw new Error("Minimal satu item menu portofolio harus aktif");
  }

  if (seen.size !== PORTFOLIO_MENU_TAB_KEYS.length) {
    throw new Error("Semua item menu portofolio wajib dikirim");
  }

  for (const item of payload) {
    const label = String(item.label ?? "").trim();
    const sortOrder = Number(item.sortOrder);
    await prisma.portfolioMenuItem.upsert({
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
