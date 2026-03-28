import { prisma } from "@/lib/prisma";
import {
  type ResolvedWilayah,
  resolveDistrictFromPackage,
} from "@/lib/wilayahPackage";

export type { ResolvedWilayah };

export async function resolveWilayahByDistrictId(
  districtId: string
): Promise<ResolvedWilayah | null> {
  try {
    const row = await prisma.indonesiaDistrict.findUnique({
      where: { id: districtId },
      include: { regency: { include: { province: true } } },
    });
    if (row) {
      return {
        kecamatan: row.name,
        kabupaten: row.regency.name,
        provinsi: row.regency.province.name,
      };
    }
  } catch {
    /* tabel belum ada / DB error → paket */
  }
  return resolveDistrictFromPackage(districtId);
}
