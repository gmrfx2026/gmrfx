import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyFollowersNewStatus } from "@/lib/memberNotifications";
import { sanitizePlainText } from "@/lib/sanitizePlainText";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const content = sanitizePlainText(String(body.profileStatus ?? ""), 500);
  if (!content) return NextResponse.json({ error: "Status wajib diisi" }, { status: 400 });

  const status = await prisma.statusEntry.create({
    data: {
      userId: session.user.id,
      content,
    },
  });

  // Simpan versi terakhir juga agar fitur lama tetap tampil.
  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileStatus: content },
  });

  void notifyFollowersNewStatus({
    authorId: session.user.id,
    statusId: status.id,
    contentPreview: content,
  }).catch(() => {
    /* ignore */
  });

  return NextResponse.json({ ok: true, statusId: status.id });
}
