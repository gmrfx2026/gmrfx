import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  GMRFX_OFFICIAL_SELLER_SETTING_KEY,
  getGmrfxOfficialSellerId,
  getGmrfxOfficialSellerIdFromEnvOnly,
} from "@/lib/gmrfxOfficialSeller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: status env vs DB + pratinjau user efektif */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const envUserId = getGmrfxOfficialSellerIdFromEnvOnly();
  const dbRow = await prisma.systemSetting.findUnique({
    where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY },
  });
  const databaseUserId = dbRow?.value?.trim() || null;
  const effectiveUserId = await getGmrfxOfficialSellerId();

  let preview: { id: string; email: string; name: string | null; hasWallet: boolean } | null = null;
  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, name: true, walletAddress: true },
    });
    if (u) {
      preview = {
        id: u.id,
        email: u.email,
        name: u.name,
        hasWallet: Boolean(u.walletAddress?.trim()),
      };
    }
  }

  return NextResponse.json({
    envUserId,
    databaseUserId,
    effectiveUserId,
    envOverridesDatabase: Boolean(envUserId),
    preview,
  });
}

type Body = { userIdOrEmail?: string; clear?: boolean };

/**
 * POST: simpan ke SystemSetting (user id valid), atau clear DB.
 * Env `GMRFX_OFFICIAL_SELLER_USER_ID` tidak bisa diubah dari sini — hapus di server jika ingin pakai nilai DB.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  if (body.clear === true) {
    await prisma.systemSetting.deleteMany({ where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY } });
    return NextResponse.json({ ok: true, cleared: true });
  }

  const raw = String(body.userIdOrEmail ?? "").trim();
  if (!raw) {
    return NextResponse.json({ error: "userIdOrEmail wajib (atau gunakan clear: true)" }, { status: 400 });
  }

  const user = raw.includes("@")
    ? await prisma.user.findUnique({
        where: { email: raw.toLowerCase() },
        select: { id: true, email: true, name: true },
      })
    : await prisma.user.findUnique({
        where: { id: raw },
        select: { id: true, email: true, name: true },
      });

  if (!user) {
    return NextResponse.json(
      { error: "User tidak ditemukan (cek email atau ID cuid)" },
      { status: 404 }
    );
  }

  await prisma.systemSetting.upsert({
    where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY },
    create: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY, value: user.id },
    update: { value: user.id },
  });

  return NextResponse.json({
    ok: true,
    savedUserId: user.id,
    user: { email: user.email, name: user.name },
  });
}
