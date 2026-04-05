import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const SITE_NAME_KEY = "site_name";
export const DEFAULT_SITE_NAME = "GMR FX";

/**
 * Ambil nama situs dari database.
 * Di-cache 60 detik; di-invalidate saat admin menyimpan pengaturan (tag: site_name).
 */
export const getSiteName = unstable_cache(
  async (): Promise<string> => {
    try {
      const row = await prisma.systemSetting.findUnique({ where: { key: SITE_NAME_KEY } });
      return row?.value?.trim() || DEFAULT_SITE_NAME;
    } catch {
      return DEFAULT_SITE_NAME;
    }
  },
  [SITE_NAME_KEY],
  { revalidate: 60, tags: [SITE_NAME_KEY] }
);
