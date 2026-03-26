import sanitizeHtml from "sanitize-html";
import { isAllowedArticleImageSrc } from "./articleImagePolicy";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "cite",
  "footer",
  "code",
  "pre",
  "span",
  "img",
  "hr",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
];

function hrefAllowed(href: string): boolean {
  return /^(?:(?:https?|mailto):|\/|#)/i.test(String(href ?? "").trim());
}

function clampTableSpan(attribs: Record<string, string>): Record<string, string> {
  const next = { ...attribs };
  for (const key of ["colspan", "rowspan"] as const) {
    const raw = next[key];
    if (raw === undefined) continue;
    const n = Number.parseInt(String(raw), 10);
    if (!Number.isFinite(n) || n < 1 || n > 50) {
      delete next[key];
    }
  }
  return next;
}

/** Konten artikel: izinkan formatting umum, tanpa script/iframes berbahaya.
 *  Pakai `sanitize-html` (htmlparser2) — tanpa jsdom/DOMPurify agar tidak ada ERR_REQUIRE_ESM di Vercel.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "loading"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      img: (tagName, attribs) => {
        const src = attribs.src;
        if (src && !isAllowedArticleImageSrc(String(src))) {
          const next = { ...attribs };
          delete next.src;
          return { tagName, attribs: next };
        }
        return { tagName, attribs };
      },
      a: (tagName, attribs) => {
        const href = attribs.href;
        if (href && !hrefAllowed(String(href))) {
          const next = { ...attribs };
          delete next.href;
          return { tagName, attribs: next };
        }
        return { tagName, attribs };
      },
      td: (tagName, attribs) => ({ tagName, attribs: clampTableSpan(attribs) }),
      th: (tagName, attribs) => {
        let a = clampTableSpan(attribs);
        if (a.scope) {
          const v = String(a.scope).toLowerCase();
          if (!["col", "row", "colgroup", "rowgroup"].includes(v)) {
            const next = { ...a };
            delete next.scope;
            a = next;
          }
        }
        return { tagName, attribs: a };
      },
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "img") {
        const src = frame.attribs?.src;
        if (!src || !isAllowedArticleImageSrc(String(src))) {
          return true;
        }
      }
      return false;
    },
  });
}
