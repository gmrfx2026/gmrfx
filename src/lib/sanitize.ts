import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { isAllowedArticleImageSrc } from "./articleImagePolicy";

/**
 * DOMPurify di server: pakai jsdom 24 (CJS) — jangan pakai isomorphic-dompurify
 * yang menarik jsdom 28 + html-encoding-sniffer 6 + @exodus/bytes (ERR_REQUIRE_ESM di Vercel).
 */
const dompurifyWindow = new JSDOM("<!DOCTYPE html>").window;
const DOMPurify = createDOMPurify(dompurifyWindow as unknown as Window & typeof globalThis);

let articlePurifyHooksInstalled = false;

function ensureArticlePurifyHooks() {
  if (articlePurifyHooksInstalled) return;
  articlePurifyHooksInstalled = true;

  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const tag = String(node.nodeName).toUpperCase();

    if (data.attrName === "src" && tag === "IMG") {
      const v = String(data.attrValue ?? "").trim();
      if (!isAllowedArticleImageSrc(v)) {
        data.keepAttr = false;
      }
      return;
    }

    if (data.attrName === "style") {
      data.keepAttr = false;
      return;
    }

    if ((data.attrName === "colspan" || data.attrName === "rowspan") && (tag === "TD" || tag === "TH")) {
      const n = Number.parseInt(String(data.attrValue ?? ""), 10);
      if (!Number.isFinite(n) || n < 1 || n > 50) {
        data.keepAttr = false;
      }
      return;
    }

    if (data.attrName === "scope" && tag === "TH") {
      const v = String(data.attrValue ?? "").toLowerCase();
      if (!["col", "row", "colgroup", "rowgroup"].includes(v)) {
        data.keepAttr = false;
      }
    }
  });

  DOMPurify.addHook("afterSanitizeElements", (node) => {
    if (String(node.nodeName).toUpperCase() !== "IMG") return;
    const el = node as Element;
    if (typeof el.getAttribute === "function" && !el.getAttribute("src")) {
      el.remove();
    }
  });
}

/** Konten artikel: izinkan formatting umum, tanpa script/iframes berbahaya */
export function sanitizeArticleHtml(dirty: string): string {
  ensureArticlePurifyHooks();
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
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
    ALLOWED_ATTR: [
      "href",
      "title",
      "class",
      "target",
      "rel",
      "src",
      "alt",
      "loading",
      "colspan",
      "rowspan",
      "scope",
    ],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/|#)/i,
  });
}
