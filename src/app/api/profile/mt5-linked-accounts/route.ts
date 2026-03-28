import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Login MT unik yang sudah pernah mengirim deal atau snapshot (untuk sidebar portofolio). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [fromDeals, fromSnaps] = await Promise.all([
    prisma.mtDeal.groupBy({
      by: ["mtLogin"],
      where: { userId },
    }),
    prisma.mtAccountSnapshot.groupBy({
      by: ["mtLogin"],
      where: { userId },
    }),
  ]);

  const set = new Set<string>();
  for (const r of fromDeals) set.add(r.mtLogin);
  for (const r of fromSnaps) set.add(r.mtLogin);

  const mtLogins = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return NextResponse.json({ mtLogins });
}
