import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseSafeHttpUrl } from "@/lib/socialLinks";
import { z } from "zod";

const linkField = z.string().max(500).optional();

const patchSchema = z.object({
  socialTiktokUrl: linkField,
  socialInstagramUrl: linkField,
  socialFacebookUrl: linkField,
  socialTelegramUrl: linkField,
  socialYoutubeUrl: linkField,
});

function toStored(raw: string | undefined): { value: string | null } | "invalid" | "skip" {
  if (raw === undefined) return "skip";
  const t = raw.trim();
  if (!t) return { value: null };
  const href = parseSafeHttpUrl(t);
  if (!href) return "invalid";
  return { value: href };
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const d = parsed.data;
  const data: Record<string, string | null> = {};

  const map: [keyof typeof d, string][] = [
    ["socialTiktokUrl", "socialTiktokUrl"],
    ["socialInstagramUrl", "socialInstagramUrl"],
    ["socialFacebookUrl", "socialFacebookUrl"],
    ["socialTelegramUrl", "socialTelegramUrl"],
    ["socialYoutubeUrl", "socialYoutubeUrl"],
  ];

  for (const [key, col] of map) {
    if (!(key in d)) continue;
    const out = toStored(d[key]);
    if (out === "invalid") {
      return NextResponse.json(
        { error: "Salah satu tautan tidak valid. Gunakan alamat http atau https." },
        { status: 400 },
      );
    }
    if (out === "skip") continue;
    data[col] = out.value;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
