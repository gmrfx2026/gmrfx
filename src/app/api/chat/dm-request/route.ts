import { NextResponse } from "next/server";
import { NotificationType, ChatDmRequestStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatDbErrorMessage } from "@/lib/chatDbErrorMessage";
import { isUserProfileComplete } from "@/lib/profileComplete";
import { getPrivateDmAccess } from "@/lib/chatDmAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeIntro(text: string, maxLen: number): string {
  return text.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isUserProfileComplete(session.user.id))) {
      return NextResponse.json({ error: "Lengkapi profil terlebih dahulu." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
    }

    const peerId = String((body as { peerId?: unknown })?.peerId ?? "");
    const introRaw = (body as { introMessage?: unknown })?.introMessage;
    const introMessage = introRaw != null ? sanitizeIntro(String(introRaw), 2000) : "";

    if (!peerId || peerId === session.user.id) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const peer = await prisma.user.findFirst({
      where: { id: peerId, memberStatus: "ACTIVE", profileComplete: true },
      select: { id: true, name: true },
    });
    if (!peer) {
      return NextResponse.json(
        { error: "Member tidak ditemukan atau belum melengkapi profil." },
        { status: 404 }
      );
    }

    const access = await getPrivateDmAccess(session.user.id, peerId);
    if (access.allowed) {
      return NextResponse.json({ ok: true, state: "allowed" as const });
    }
    if (access.state === "pending_out") {
      return NextResponse.json({ ok: true, state: "pending_out" as const });
    }
    if (access.state === "pending_in") {
      return NextResponse.json(
        {
          error:
            "Orang ini sudah mengirim permintaan chat kepada Anda — terima atau tolak di sini terlebih dahulu.",
        },
        { status: 409 }
      );
    }

    const existing = await prisma.chatDmRequest.findUnique({
      where: {
        requesterId_targetId: { requesterId: session.user.id, targetId: peerId },
      },
    });

    const data = {
      status: ChatDmRequestStatus.PENDING,
      introMessage: introMessage || null,
      respondedAt: null,
    };

    if (existing) {
      await prisma.chatDmRequest.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.chatDmRequest.create({
        data: {
          requesterId: session.user.id,
          targetId: peerId,
          ...data,
        },
      });
    }

    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const requesterName = requester?.name ?? "Member";

    await prisma.notification.create({
      data: {
        userId: peerId,
        actorId: session.user.id,
        type: NotificationType.CHAT_DM_REQUEST,
        title: "Permintaan chat",
        body: introMessage
          ? `${requesterName} ingin mengobrol: ${introMessage.slice(0, 120)}${introMessage.length > 120 ? "…" : ""}`
          : `${requesterName} ingin mengobrol dengan Anda.`,
        linkUrl: `/profil?tab=chat&peerId=${encodeURIComponent(session.user.id)}`,
      },
    });

    return NextResponse.json({ ok: true, state: "pending_out" as const });
  } catch (e) {
    console.error("chat/dm-request", e);
    return NextResponse.json({ error: chatDbErrorMessage(e) }, { status: 500 });
  }
}
