import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OtpPurpose } from "@prisma/client";
import { verifyOtp } from "@/lib/otp";
import { normalizePhoneE164, phoneVariants } from "@/lib/phoneNormalize";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const newPhoneRaw = String(body.newPhone ?? "").trim();
  const code = String(body.code ?? "").trim();
  if (!newPhoneRaw || !code) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const newPhone = normalizePhoneE164(newPhoneRaw);
  if (!newPhone) {
    return NextResponse.json(
      { error: "Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxxx atau +62812xxxxxxxx." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.phoneWhatsApp) {
    return NextResponse.json({ error: "Nomor lama tidak ada" }, { status: 400 });
  }

  const ok = await verifyOtp(user.id, OtpPurpose.PHONE_UPDATE, user.phoneWhatsApp, code);
  if (!ok) {
    return NextResponse.json({ error: "OTP salah atau kadaluarsa" }, { status: 400 });
  }

  /** Cek duplikat nomor baru pada user lain (exclude diri sendiri); cover variasi format lama. */
  const phoneDup = await prisma.user.findFirst({
    where: {
      id: { not: user.id },
      phoneWhatsApp: { in: phoneVariants(newPhone) },
    },
    select: { id: true },
  });
  if (phoneDup) {
    return NextResponse.json({ error: "Nomor WhatsApp sudah dipakai member lain" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneWhatsApp: newPhone },
  });

  return NextResponse.json({ ok: true });
}
