import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateMt5ApiToken } from "@/lib/mt5Token";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/copy-token-regen
 * Body: { followId: string }
 *
 * Regenerasi token untuk langganan copy yang dimiliki user yang sedang login.
 * Token lama langsung tidak berlaku. Kembalikan plain token baru (satu-satunya kesempatan).
 */

const bodySchema = z.object({
  followId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { followId } = parsed.data;

  const follow = await prisma.mtCopyFollow.findFirst({
    where: {
      id: followId,
      followerUserId: session.user.id,
    },
    select: { id: true, expiresAt: true },
  });

  if (!follow) {
    return NextResponse.json({ error: "Langganan tidak ditemukan" }, { status: 404 });
  }

  // Boleh regen meski kadaluarsa (untuk keperluan melihat kembali, tapi endpoint copy-feed akan tolak)
  const { plain, hash, hint } = generateMt5ApiToken();

  await prisma.mtCopyFollow.update({
    where: { id: follow.id },
    data: {
      copyTokenHash: hash,
      copyTokenHint: hint,
      copyTokenIssuedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, copyToken: plain, tokenHint: hint });
}
