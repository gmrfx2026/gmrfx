/**
 * URL gambar kartu berita beranda: utamakan Blob/HTTPS tersimpan, lalu fallback
 * ke gambar HTTPS pertama di HTML (saat imageUrl menunjuk /uploads/ yang hilang di server tanpa volume).
 */
export function extractFirstHttpsImageFromNewsHtml(html: string | null | undefined): string | null {
  const m = String(html ?? "").match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i);
  return m?.[1]?.trim() || null;
}

export function homeNewsDisplayImageUrl(row: {
  imageUrl: string | null;
  contentHtml?: string | null;
}): string | null {
  const u = row.imageUrl?.trim() || null;
  if (u && (u.startsWith("https://") || u.startsWith("http://"))) return u;
  const fromHtml = extractFirstHttpsImageFromNewsHtml(row.contentHtml);
  if (u?.startsWith("/")) {
    if (fromHtml) return fromHtml;
    return u;
  }
  return fromHtml || u;
}

export function imgReferrerPolicyForSrc(src: string): "no-referrer" | undefined {
  return src.startsWith("https://") || src.startsWith("http://") ? "no-referrer" : undefined;
}
