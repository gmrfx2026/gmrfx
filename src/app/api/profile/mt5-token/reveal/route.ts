import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptMtLinkTokenPlain } from "@/lib/mtLinkTokenCrypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ id: z.string().min(1) });

/** Hanya untuk pemilik login: kembalikan plaintext token (untuk salin ke EA). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "id wajib" }, { status: 400 });
  }

  const row = await prisma.mtLinkToken.findFirst({
    where: {
      id: parsed.data.id,
      userId: session.user.id,
      revokedAt: null,
    },
    select: { tokenCipher: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 404 });
  }

  if (!row.tokenCipher) {
    return NextResponse.json(
      {
        error:
          "Token ini dibuat sebelum fitur salin. Cabut token ini lalu buat token baru untuk mendapat tombol salin.",
        code: "LEGACY_TOKEN",
      },
      { status: 410 },
    );
  }

  try {
    const token = decryptMtLinkTokenPlain(row.tokenCipher);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Gagal membuka token (kunci server?)" }, { status: 500 });
  }
}
