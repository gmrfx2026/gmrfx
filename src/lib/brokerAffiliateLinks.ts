import { AFFILIATE_GO_PATH } from "./affiliatePartners";

const A_OPEN =
  `<a href="${AFFILIATE_GO_PATH}" target="_blank" rel="noopener noreferrer sponsored">`;
const A_CLOSE = "</a>";

function isOpeningAnchor(tag: string): boolean {
  return /^<a\s/i.test(tag);
}

function isClosingAnchor(tag: string): boolean {
  return /^<\/a>/i.test(tag);
}

/**
 * Membungkus istilah terkait pialang/broker dengan tautan ke /go.
 * Tidak memproses teks di dalam tag &lt;a&gt; apa pun (hindari tautan bersarang).
 */
export function injectBrokerAffiliateLinks(html: string): string {
  const parts = html.split(/(<[^>]+>)/);
  let anchorDepth = 0;
  const out: string[] = [];

  for (const part of parts) {
    if (part.startsWith("<")) {
      if (isOpeningAnchor(part)) anchorDepth++;
      else if (isClosingAnchor(part) && anchorDepth > 0) anchorDepth--;
      out.push(part);
      continue;
    }
    if (anchorDepth > 0) {
      out.push(part);
      continue;
    }
    let t = part;
    const patterns: RegExp[] = [
      /market\s+maker/gi,
      /ECN\s*\/\s*STP/gi,
      /pialang\b/gi,
      /\bbroker\b/gi,
    ];
    for (const re of patterns) {
      t = t.replace(re, `${A_OPEN}$&${A_CLOSE}`);
    }
    out.push(t);
  }

  return out.join("");
}
