import { FilterXSS } from "xss";
import type { IFilterXSSOptions } from "xss";
import { isAllowedArticleImageSrc } from "./articleImagePolicy";

const CLS = ["class"];

function hrefAllowed(href: string): boolean {
  return /^(?:(?:https?|mailto):|\/|#)/i.test(String(href ?? "").trim());
}

function extractImgSrc(openTagHtml: string): string | null {
  const m = openTagHtml.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>/]+))/i);
  if (!m) return null;
  const v = (m[1] ?? m[2] ?? m[3] ?? "").trim();
  return v || null;
}

const articleXssOptions: IFilterXSSOptions = {
  stripIgnoreTag: true,
  whiteList: {
    p: CLS,
    br: CLS,
    strong: CLS,
    b: CLS,
    em: CLS,
    i: CLS,
    u: CLS,
    s: CLS,
    h1: CLS,
    h2: CLS,
    h3: CLS,
    h4: CLS,
    ul: CLS,
    ol: CLS,
    li: CLS,
    a: ["href", "title", "target", "rel", "class"],
    blockquote: CLS,
    cite: CLS,
    footer: CLS,
    code: CLS,
    pre: CLS,
    span: CLS,
    img: ["src", "alt", "loading", "class"],
    hr: CLS,
    table: CLS,
    thead: CLS,
    tbody: CLS,
    tfoot: CLS,
    tr: CLS,
    th: ["colspan", "rowspan", "scope", "class"],
    td: ["colspan", "rowspan", "class"],
    caption: CLS,
  },
  onTag(tag, html, options) {
    if (tag === "img" && !options.isClosing) {
      const src = extractImgSrc(html);
      if (!src || !isAllowedArticleImageSrc(src)) {
        return "";
      }
    }
  },
  onTagAttr(tag, name, value) {
    if (tag === "a" && name === "href" && !hrefAllowed(value)) {
      return "";
    }
    if ((tag === "td" || tag === "th") && (name === "colspan" || name === "rowspan")) {
      const n = Number.parseInt(String(value), 10);
      if (!Number.isFinite(n) || n < 1 || n > 50) {
        return "";
      }
    }
    if (tag === "th" && name === "scope") {
      const v = String(value).toLowerCase();
      if (!["col", "row", "colgroup", "rowgroup"].includes(v)) {
        return "";
      }
    }
  },
};

const articleFilter = new FilterXSS(articleXssOptions);

/** Konten artikel: formatting umum, tanpa script/iframes. Pakai `xss` (tanpa jsdom/htmlparser2). */
export function sanitizeArticleHtml(dirty: string): string {
  return articleFilter.process(dirty);
}
