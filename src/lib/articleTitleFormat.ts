/**
 * Kapital di awal setiap kata (spasi/pemisah); bagian dipisah "-" juga diformat.
 * Jika seluruh huruf ber-case pada string adalah KAPITAL, string dibiarkan (ALL CAPS).
 */
export function formatArticleTitle(raw: string): string {
  const t = raw.trim();
  if (!t) return t;

  const casedChars = t.split("").filter((ch) => ch !== ch.toLowerCase() || ch !== ch.toUpperCase());
  if (
    casedChars.length > 0 &&
    casedChars.every((ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase())
  ) {
    return t;
  }

  const letterAt = (s: string): number => {
    for (let i = 0; i < s.length; i++) {
      const c = s[i]!;
      if (c.toLowerCase() !== c.toUpperCase()) return i;
    }
    return -1;
  };

  const capPart = (part: string): string => {
    if (!part) return part;
    const i = letterAt(part);
    if (i < 0) return part;
    return part.slice(0, i) + part[i]!.toUpperCase() + part.slice(i + 1).toLowerCase();
  };

  return t
    .split(/\s+/)
    .map((word) => word.split("-").map(capPart).join("-"))
    .join(" ");
}
