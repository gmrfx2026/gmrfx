/**
 * Samakan URL gambar RSS/CDN agar lolos sanitizer (https) dan tidak kena mixed content.
 */
export function upgradeRemoteImageUrl(url: string): string {
  const s = String(url ?? "").trim();
  if (!s || s.toLowerCase().startsWith("data:")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (/^http:\/\//i.test(s)) return `https://${s.slice(7)}`;
  return s;
}

/** Naikkan skema di setiap `src` pada tag `<img>` (RSS internasional sering http atau protocol-relative). */
export function upgradeImgSrcsInHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/\bsrc\s*=\s*(["'])(\/\/[^"']+)\1/gi, (_m, q, path) => `src=${q}https:${path}${q}`)
    .replace(/\bsrc\s*=\s*(["'])(http:\/\/[^"']+)\1/gi, (_m, q, rest) => `src=${q}https://${rest.slice(7)}${q}`);
}
