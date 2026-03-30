import {
  MT_MARKETPLACE_MAX_BYTES,
  resolveMtMarketplaceExt,
  storeMtMarketplaceFile,
  localMtMarketplaceFileAbsolutePath,
} from "@/lib/mtMarketplaceUpload";

export const INDICATOR_MAX_BYTES = MT_MARKETPLACE_MAX_BYTES;

export const resolveIndicatorExt = resolveMtMarketplaceExt;

export async function storeIndicatorFile(
  userId: string,
  file: File,
  buf: Buffer
): Promise<{ fileUrl: string; fileName: string }> {
  return storeMtMarketplaceFile(userId, file, buf, "indicators", "indikator");
}

export function localIndicatorFileAbsolutePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith("/uploads/indicators/")) return null;
  return localMtMarketplaceFileAbsolutePath(fileUrl);
}
