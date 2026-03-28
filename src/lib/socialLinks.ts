const MAX_LEN = 500;

/** Mengembalikan URL aman http(s) atau null jika kosong/tidak valid. */
export function parseSafeHttpUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.length > MAX_LEN) return null;
  let href = t;
  if (!/^https?:\/\//i.test(href)) {
    if (href.startsWith("//")) href = `https:${href}`;
    else href = `https://${href}`;
  }
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  return u.href;
}

export function normalizeSocialLinkForForm(stored: string | null | undefined): string {
  return stored?.trim() ?? "";
}
