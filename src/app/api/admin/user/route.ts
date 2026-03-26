import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MemberStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.email) data.email = String(body.email).toLowerCase().trim();
  if (body.name !== undefined) data.name = body.name ? String(body.name) : null;
  if (body.phoneWhatsApp !== undefined) data.phoneWhatsApp = body.phoneWhatsApp ? String(body.phoneWhatsApp) : null;
  if (body.walletAddress !== undefined) data.walletAddress = body.walletAddress ? String(body.walletAddress).toUpperCase() : null;
  if (body.walletBalance !== undefined) data.walletBalance = new Decimal(Number(body.walletBalance).toFixed(2));
  if (body.addressLine !== undefined) data.addressLine = body.addressLine ? String(body.addressLine) : null;
  if (body.kecamatan !== undefined) data.kecamatan = body.kecamatan ? String(body.kecamatan) : null;
  if (body.kabupaten !== undefined) data.kabupaten = body.kabupaten ? String(body.kabupaten) : null;
  if (body.provinsi !== undefined) data.provinsi = body.provinsi ? String(body.provinsi) : null;
  if (body.kodePos !== undefined) data.kodePos = body.kodePos ? String(body.kodePos) : null;
  if (body.negara !== undefined) data.negara = body.negara ? String(body.negara) : null;
  if (body.memberStatus && (body.memberStatus === "ACTIVE" || body.memberStatus === "SUSPENDED")) {
    data.memberStatus = body.memberStatus as MemberStatus;
  }
  if (body.role && (body.role === "USER" || body.role === "ADMIN")) {
    data.role = body.role as Role;
  }
  if (body.password && String(body.password).length >= 8) {
    data.passwordHash = await bcrypt.hash(String(body.password), 12);
  }

  try {
    await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update gagal (email/wallet duplikat?)" }, { status: 400 });
  }
}
