/**
 * URL gambar kartu berita: Blob/HTTPS di `imageUrl`, lalu `imageSourceUrl` (RSS),
 * lalu cuplikan dari `contentHtml`, terakhir path relatif (dev).
 */
export function normalizeNewsDisplayImageUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s.startsWith("//")) return `https:${s}`;
  return s;
}

/** Ambil URL gambar pertama dari HTML berita (berbagai bentuk atribut src; boleh baris baru di tag). */
export function extractFirstImageUrlFromNewsHtml(html: string | null | undefined): string | null {
  const s = String(html ?? "");
  const patterns: RegExp[] = [
    /<img\b[\s\S]*?\bsrc\s*=\s*["'](https?:\/\/[^"'>\s]+)["']/i,
    /<img\b[\s\S]*?\bsrc\s*=\s*["'](\/\/[^"'>\s]+)["']/i,
    /<img\b[\s\S]*?\bsrc\s*=\s*(https?:\/\/[^\s>]+)/i,
    /<img\b[\s\S]*?\bsrc\s*=\s*(\/\/[^\s>]+)/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) {
      const n = normalizeNewsDisplayImageUrl(m[1].trim());
      if (n && (n.startsWith("https://") || n.startsWith("http://"))) return n;
    }
  }
  return null;
}

export function homeNewsDisplayImageUrl(row: {
  imageUrl: string | null;
  imageSourceUrl?: string | null;
  contentHtml?: string | null;
}): string | null {
  const u = row.imageUrl?.trim() || null;
  const source = normalizeNewsDisplayImageUrl(row.imageSourceUrl);
  const fromHtml = extractFirstImageUrlFromNewsHtml(row.contentHtml);

  if (u && (u.startsWith("https://") || u.startsWith("http://"))) return u;

  if (u?.startsWith("/")) {
    if (fromHtml) return fromHtml;
    if (source) return source;
    return null;
  }

  if (fromHtml) return fromHtml;
  if (source) return source;
  return u || null;
}

export function imgReferrerPolicyForSrc(src: string): "no-referrer" | undefined {
  return src.startsWith("https://") || src.startsWith("http://") ? "no-referrer" : undefined;
}
