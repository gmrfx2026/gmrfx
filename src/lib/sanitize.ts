import sanitizeHtml from "sanitize-html";
import { isAllowedArticleImageSrc } from "./articleImagePolicy";

function sanitizeTableCellAttrs(
  attribs: Record<string, string | undefined>,
  allowScope: boolean
): Record<string, string> {
  const next: Record<string, string> = {};

  if (typeof attribs.class === "string" && attribs.class.trim()) {
    next.class = attribs.class.trim();
  }

  for (const key of ["colspan", "rowspan"] as const) {
    const raw = String(attribs[key] ?? "").trim();
    if (!raw) continue;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 50) {
      next[key] = String(n);
    }
  }

  if (allowScope) {
    const scope = String(attribs.scope ?? "").trim().toLowerCase();
    if (["col", "row", "colgroup", "rowgroup"].includes(scope)) {
      next.scope = scope;
    }
  }

  return next;
}

/** Konten artikel: izinkan formatting umum, tanpa script/iframes berbahaya */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
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
    ],
    allowedAttributes: {
      "*": ["class"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "loading"],
      th: ["class", "colspan", "rowspan", "scope"],
      td: ["class", "colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.href ? { rel: "noopener noreferrer nofollow" } : {}),
        },
      }),
      img: (tagName, attribs) => {
        const src = String(attribs.src ?? "").trim();
        if (!isAllowedArticleImageSrc(src)) {
          return { tagName: "span", attribs: {}, text: "" };
        }

        const next: Record<string, string> = { src };
        if (typeof attribs.class === "string" && attribs.class.trim()) next.class = attribs.class.trim();
        if (typeof attribs.alt === "string" && attribs.alt.trim()) next.alt = attribs.alt.trim();
        if (typeof attribs.loading === "string" && attribs.loading.trim()) next.loading = attribs.loading.trim();
        return { tagName, attribs: next };
      },
      td: (tagName, attribs) => ({
        tagName,
        attribs: sanitizeTableCellAttrs(attribs, false),
      }),
      th: (tagName, attribs) => ({
        tagName,
        attribs: sanitizeTableCellAttrs(attribs, true),
      }),
    },
  });
}

export function sanitizePlainText(text: string, maxLen: number): string {
  const t = text.replace(/[<>]/g, "").trim().slice(0, maxLen);
  return t;
}
