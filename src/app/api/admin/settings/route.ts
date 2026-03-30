import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ARTICLE_COMMENTS_PER_PAGE_KEY } from "@/lib/articleCommentPagination";
import {
  MEMBER_STATUS_COMMENTS_PER_PAGE_KEY,
  MEMBER_TIMELINE_PER_PAGE_KEY,
} from "@/lib/memberStatusPagination";
import { clampPageSize } from "@/lib/walletTransferFilters";
import {
  HOME_MEMBER_TICKER_VISIBLE_KEY,
  HOME_NEWS_DOMESTIC_VISIBLE_KEY,
  HOME_NEWS_INTERNATIONAL_VISIBLE_KEY,
  HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY,
  parseHomeNewsHomepagePerBlock,
} from "@/lib/homePageSettings";
import {
  HOME_NEWS_RSS_DOMESTIC_URL_KEY,
  HOME_NEWS_RSS_INTERNATIONAL_URL_KEY,
  isValidOptionalHttpUrl,
  normalizeRssFeedUrl,
} from "@/lib/homeNewsRssSettings";
import { MARKETPLACE_ESCROW_DAYS_KEY } from "@/lib/marketplaceEscrow";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [fee, commentsPer, timelinePer, statusCommentsPer, rssDn, rssInt, newsPerBlock, escrowDays] =
    await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } }),
      prisma.systemSetting.findUnique({ where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: MEMBER_TIMELINE_PER_PAGE_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_RSS_DOMESTIC_URL_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_RSS_INTERNATIONAL_URL_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY } }),
      prisma.systemSetting.findUnique({ where: { key: MARKETPLACE_ESCROW_DAYS_KEY } }),
    ]);
  return NextResponse.json({
    platformFeePercent: fee?.value ?? "0",
    articleCommentsPerPage: commentsPer?.value ?? "10",
    memberTimelinePerPage: timelinePer?.value ?? "10",
    memberStatusCommentsPerPage: statusCommentsPer?.value ?? "10",
    homeNewsRssDomesticUrl: rssDn?.value ?? "",
    homeNewsRssInternationalUrl: rssInt?.value ?? "",
    homeNewsPerBlockHomepage: String(parseHomeNewsHomepagePerBlock(newsPerBlock?.value ?? null)),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.platformFeePercent !== undefined) {
    const platformFeePercent = String(body.platformFeePercent ?? "");
    if (!platformFeePercent) {
      return NextResponse.json({ error: "Nilai fee wajib" }, { status: 400 });
    }
    await prisma.systemSetting.upsert({
      where: { key: "platform_fee_percent" },
      create: { key: "platform_fee_percent", value: platformFeePercent },
      update: { value: platformFeePercent },
    });
  }

  if (body.articleCommentsPerPage !== undefined) {
    const n = Number.parseInt(String(body.articleCommentsPerPage), 10);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "Jumlah komentar per halaman tidak valid" }, { status: 400 });
    }
    const clamped = clampPageSize(n);
    await prisma.systemSetting.upsert({
      where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY },
      create: { key: ARTICLE_COMMENTS_PER_PAGE_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    });
  }

  if (body.memberTimelinePerPage !== undefined) {
    const n = Number.parseInt(String(body.memberTimelinePerPage), 10);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "Jumlah status per halaman tidak valid" }, { status: 400 });
    }
    const clamped = clampPageSize(n);
    await prisma.systemSetting.upsert({
      where: { key: MEMBER_TIMELINE_PER_PAGE_KEY },
      create: { key: MEMBER_TIMELINE_PER_PAGE_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    });
  }

  if (body.homeMemberTickerVisible !== undefined) {
    const on = Boolean(body.homeMemberTickerVisible);
    await prisma.systemSetting.upsert({
      where: { key: HOME_MEMBER_TICKER_VISIBLE_KEY },
      create: { key: HOME_MEMBER_TICKER_VISIBLE_KEY, value: on ? "1" : "0" },
      update: { value: on ? "1" : "0" },
    });
  }

  if (body.homeNewsDomesticVisible !== undefined) {
    const on = Boolean(body.homeNewsDomesticVisible);
    await prisma.systemSetting.upsert({
      where: { key: HOME_NEWS_DOMESTIC_VISIBLE_KEY },
      create: { key: HOME_NEWS_DOMESTIC_VISIBLE_KEY, value: on ? "1" : "0" },
      update: { value: on ? "1" : "0" },
    });
  }

  if (body.homeNewsInternationalVisible !== undefined) {
    const on = Boolean(body.homeNewsInternationalVisible);
    await prisma.systemSetting.upsert({
      where: { key: HOME_NEWS_INTERNATIONAL_VISIBLE_KEY },
      create: { key: HOME_NEWS_INTERNATIONAL_VISIBLE_KEY, value: on ? "1" : "0" },
      update: { value: on ? "1" : "0" },
    });
  }

  if (body.homeNewsPerBlockHomepage !== undefined) {
    const clamped = parseHomeNewsHomepagePerBlock(String(body.homeNewsPerBlockHomepage ?? "6"));
    await prisma.systemSetting.upsert({
      where: { key: HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY },
      create: { key: HOME_NEWS_PER_BLOCK_HOMEPAGE_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    });
  }

  if (body.homeNewsRssDomesticUrl !== undefined) {
    const u = normalizeRssFeedUrl(String(body.homeNewsRssDomesticUrl ?? ""));
    if (!isValidOptionalHttpUrl(u)) {
      return NextResponse.json({ error: "URL RSS dalam negeri tidak valid (kosongkan atau pakai http/https)" }, { status: 400 });
    }
    if (!u) {
      await prisma.systemSetting.deleteMany({ where: { key: HOME_NEWS_RSS_DOMESTIC_URL_KEY } });
    } else {
      await prisma.systemSetting.upsert({
        where: { key: HOME_NEWS_RSS_DOMESTIC_URL_KEY },
        create: { key: HOME_NEWS_RSS_DOMESTIC_URL_KEY, value: u },
        update: { value: u },
      });
    }
  }

  if (body.homeNewsRssInternationalUrl !== undefined) {
    const u = normalizeRssFeedUrl(String(body.homeNewsRssInternationalUrl ?? ""));
    if (!isValidOptionalHttpUrl(u)) {
      return NextResponse.json(
        { error: "URL RSS internasional tidak valid (kosongkan atau pakai http/https)" },
        { status: 400 },
      );
    }
    if (!u) {
      await prisma.systemSetting.deleteMany({ where: { key: HOME_NEWS_RSS_INTERNATIONAL_URL_KEY } });
    } else {
      await prisma.systemSetting.upsert({
        where: { key: HOME_NEWS_RSS_INTERNATIONAL_URL_KEY },
        create: { key: HOME_NEWS_RSS_INTERNATIONAL_URL_KEY, value: u },
        update: { value: u },
      });
    }
  }

  if (body.memberStatusCommentsPerPage !== undefined) {
    const n = Number.parseInt(String(body.memberStatusCommentsPerPage), 10);
    if (!Number.isFinite(n)) {
      return NextResponse.json(
        { error: "Jumlah komentar status per halaman tidak valid" },
        { status: 400 },
      );
    }
    const clamped = clampPageSize(n);
    await prisma.systemSetting.upsert({
      where: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY },
      create: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    });
  }

  if (body.marketplaceEscrowDays !== undefined) {
    const n = Number.parseInt(String(body.marketplaceEscrowDays), 10);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "Hari escrow tidak valid" }, { status: 400 });
    }
    const clamped = Math.min(30, Math.max(1, n));
    await prisma.systemSetting.upsert({
      where: { key: MARKETPLACE_ESCROW_DAYS_KEY },
      create: { key: MARKETPLACE_ESCROW_DAYS_KEY, value: String(clamped) },
      update: { value: String(clamped) },
    });
  }

  return NextResponse.json({ ok: true });
}
