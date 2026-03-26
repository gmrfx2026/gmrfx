import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ARTICLE_COMMENTS_PER_PAGE_KEY } from "@/lib/articleCommentPagination";
import {
  MEMBER_STATUS_COMMENTS_PER_PAGE_KEY,
  MEMBER_TIMELINE_PER_PAGE_KEY,
} from "@/lib/memberStatusPagination";
import { clampPageSize } from "@/lib/walletTransferFilters";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [fee, commentsPer, timelinePer, statusCommentsPer] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } }),
    prisma.systemSetting.findUnique({ where: { key: ARTICLE_COMMENTS_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MEMBER_TIMELINE_PER_PAGE_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: MEMBER_STATUS_COMMENTS_PER_PAGE_KEY } }),
  ]);
  return NextResponse.json({
    platformFeePercent: fee?.value ?? "0",
    articleCommentsPerPage: commentsPer?.value ?? "10",
    memberTimelinePerPage: timelinePer?.value ?? "10",
    memberStatusCommentsPerPage: statusCommentsPer?.value ?? "10",
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

  return NextResponse.json({ ok: true });
}
