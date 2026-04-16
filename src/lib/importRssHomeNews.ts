import type { PrismaClient } from "@prisma/client";
import { HomeNewsScope, HomeNewsStatus } from "@prisma/client";
import RSSParser from "rss-parser";
import { formatArticleTitle } from "@/lib/articleTitleFormat";
import { injectBrokerAffiliateLinks } from "@/lib/brokerAffiliateLinks";
import { storeRemoteNewsImage } from "@/lib/newsImageStorage";
import { paraphraseNewsHtmlFromSource } from "@/lib/paraphraseNewsOpenAI";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { sanitizePlainText } from "@/lib/sanitizePlainText";
import { slugify } from "@/lib/slug";
import { stripHtmlToPlainText } from "@/lib/stripHtml";
import { upgradeImgSrcsInHtml, upgradeRemoteImageUrl } from "@/lib/upgradeRemoteImageUrl";

type RssItemExt = RSSParser.Item & { "content:encoded"?: string };

const parser = new RSSParser({
  headers: { "User-Agent": "GMRFX-NewsImport/1.0 (+https://gmrfx.app)" },
  timeout: 20000,
  customFields: {
    item: ["content:encoded"],
  },
});

function pickImageUrlFromItem(item: RssItemExt): string | null {
  const enc = item.enclosure;
  if (enc?.url) {
    const type = String(enc.type || "").toLowerCase();
    const u = String(enc.url).trim();
    if (type.startsWith("image/") || /\.(jpe?g|png|webp)(\?|$)/i.test(u)) return u;
  }
  const html = String(item["content:encoded"] ?? item.content ?? "");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1]?.trim() || null;
}

function rawContentHtml(item: RssItemExt): string {
  const encoded = item["content:encoded"];
  if (typeof encoded === "string" && encoded.trim()) return encoded;
  if (typeof item.content === "string" && item.content.trim()) return item.content;
  if (item.contentSnippet) return `<p>${item.contentSnippet}</p>`;
  return "<p></p>";
}

export type ImportRssHomeNewsOptions = {
  feedUrl: string;
  scope: HomeNewsScope;
  maxItems?: number;
  /** Perlu OPENAI_API_KEY; jika false, isi disanitasi dari RSS (bukan parafrase otomatis). */
  paraphrase?: boolean;
};

export type ImportRssHomeNewsResult = {
  created: number;
  skipped: number;
  errors: string[];
};

export async function importRssHomeNewsFeed(
  prisma: PrismaClient,
  opts: ImportRssHomeNewsOptions
): Promise<ImportRssHomeNewsResult> {
  const maxItems = Math.min(20, Math.max(1, opts.maxItems ?? 8));
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  const feed = await parser.parseURL(opts.feedUrl);
  const sourceName = feed.title?.trim() || null;
  const items = (feed.items ?? []).slice(0, maxItems);

  for (const item of items) {
    const link = item.link?.trim();
    const rawTitle = item.title?.trim();
    if (!link || !rawTitle) {
      skipped++;
      continue;
    }

    const dup = await prisma.homeNewsItem.findFirst({
      where: { scope: opts.scope, sourceUrl: link },
    });
    if (dup) {
      skipped++;
      continue;
    }

    try {
      const title = formatArticleTitle(sanitizePlainText(rawTitle, 200));
      const slug = slugify(title);

      let contentHtml: string;
      const raw = upgradeImgSrcsInHtml(rawContentHtml(item));

      if (opts.paraphrase) {
        contentHtml = sanitizeArticleHtml(
          injectBrokerAffiliateLinks(await paraphraseNewsHtmlFromSource(raw))
        );
      } else {
        contentHtml = sanitizeArticleHtml(injectBrokerAffiliateLinks(raw));
      }

      const plainForExcerpt = stripHtmlToPlainText(contentHtml);
      const excerpt = sanitizePlainText(plainForExcerpt.slice(0, 400), 400) || null;

      let imageUrl: string | null = null;
      const imgRemote = pickImageUrlFromItem(item);
      if (imgRemote) {
        const imgForStore = upgradeRemoteImageUrl(imgRemote.trim());
        imageUrl = await storeRemoteNewsImage(imgForStore);
        if (!imageUrl && /^https:\/\//i.test(imgForStore)) {
          imageUrl = imgForStore;
        }
      }

      const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date();

      await prisma.homeNewsItem.create({
        data: {
          scope: opts.scope,
          title,
          slug,
          excerpt,
          contentHtml,
          imageUrl,
          sourceUrl: link,
          sourceName,
          status: HomeNewsStatus.PUBLISHED,
          publishedAt: Number.isFinite(publishedAt.getTime()) ? publishedAt : new Date(),
          // authorId null → tampilan penulis memakai DEFAULT_HOME_NEWS_AUTHOR_SLUG (GMR Fx)
        },
      });
      created++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${rawTitle.slice(0, 60)}: ${msg}`);
    }
  }

  return { created, skipped, errors };
}
