import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userOwnsMtLogin } from "@/lib/mtCommunityPublishRows";
import { tradingActivityFromRow } from "@/lib/mtTradingActivity";

export const dynamic = "force-dynamic";

/** JSON aktivitas terbaru untuk polling dashboard (tanpa refresh halaman). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const mtLogin = url.searchParams.get("mtLogin")?.trim() ?? "";
  if (!mtLogin) {
    return NextResponse.json({ error: "mtLogin wajib" }, { status: 400 });
  }

  const owns = await userOwnsMtLogin(session.user.id, mtLogin);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.mtTradingActivity.findUnique({
    where: { userId_mtLogin: { userId: session.user.id, mtLogin } },
  });

  return NextResponse.json({
    ok: true,
    activity: tradingActivityFromRow(row),
  });
}
