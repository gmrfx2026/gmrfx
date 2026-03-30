import { sanitizeArticleHtml } from "@/lib/sanitize";

function isEffectivelyEmptyHtml(html: string): boolean {
  const t = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return !t;
}

/** Simpan ke DB: HTML aman; kosong → null. */
export function normalizeMarketplaceDescriptionHtml(raw: string): string | null {
  const s = sanitizeArticleHtml(String(raw ?? "")).trim();
  if (!s) return null;
  if (isEffectivelyEmptyHtml(s)) return null;
  return s;
}

/** Ringkasan teks untuk kartu katalog (tanpa tag HTML). */
export function marketplaceDescriptionPlainExcerpt(html: string | null | undefined, maxLen: number): string {
  if (!html?.trim()) return "";
  const t = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.slice(0, maxLen);
}
