import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listablePublicMemberWhere } from "@/lib/memberFollowListable";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";

export const dynamic = "force-dynamic";

/** Aktivitas akun publikasi komunitas — polling ringkasan publik. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const mtLogin = url.searchParams.get("mtLogin")?.trim() ?? "";
  if (!ownerId || !mtLogin) {
    return NextResponse.json({ error: "ownerId dan mtLogin wajib" }, { status: 400 });
  }

  const pub = await prisma.mtCommunityPublishedAccount.findFirst({
    where: {
      userId: ownerId,
      mtLogin,
      allowCopy: true,
      user: { ...listablePublicMemberWhere },
    },
  });

  if (!pub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.mtTradingActivity.findUnique({
    where: { userId_mtLogin: { userId: ownerId, mtLogin } },
  });

  return NextResponse.json({
    ok: true,
    activity: tradingActivityFromRow(row),
  });
}
