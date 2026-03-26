import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sanitizePlainText } from "@/lib/sanitizePlainText";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const toRaw = String(body.to ?? "").trim();
  const subject = sanitizePlainText(String(body.subject ?? ""), 200);
  const mailBody = sanitizePlainText(String(body.body ?? ""), 8000);
  if (!toRaw || !subject || !mailBody) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  let toUser = null as Awaited<ReturnType<typeof prisma.user.findFirst>>;

  if (toRaw.toLowerCase() === "admin") {
    toUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  } else {
    const q = toRaw;
    toUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: q.toLowerCase() },
          { phoneWhatsApp: q },
          { walletAddress: q.toUpperCase() },
          { name: q },
        ],
        memberStatus: "ACTIVE",
      },
    });
  }

  if (!toUser) {
    return NextResponse.json({ error: "Penerima tidak ditemukan" }, { status: 404 });
  }
  if (toUser.id === session.user.id) {
    return NextResponse.json({ error: "Tidak bisa mengirim ke diri sendiri" }, { status: 400 });
  }

  await prisma.internalMail.create({
    data: {
      fromUserId: session.user.id,
      toUserId: toUser.id,
      subject,
      body: mailBody,
    },
  });

  return NextResponse.json({ ok: true });
}
