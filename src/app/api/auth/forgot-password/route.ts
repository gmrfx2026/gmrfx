import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({})) as { email?: string };
  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, passwordHash: true, phoneWhatsApp: true, memberStatus: true },
  });

  // Selalu balas OK agar tidak membocorkan apakah email terdaftar atau tidak
  if (!user || !user.passwordHash || !user.phoneWhatsApp || user.memberStatus !== "ACTIVE") {
    return NextResponse.json({ ok: true });
  }

  await createOtp(user.id, "PASSWORD_RESET", user.phoneWhatsApp);
  return NextResponse.json({ ok: true });
}
