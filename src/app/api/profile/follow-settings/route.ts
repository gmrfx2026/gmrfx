import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FollowApprovalMode } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  followApprovalMode: z.enum(["AUTO", "APPROVAL_REQUIRED"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { followApprovalMode: true },
  });

  return NextResponse.json({
    followApprovalMode: u?.followApprovalMode ?? "AUTO",
  });
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

  await prisma.user.update({
    where: { id: session.user.id },
    data: { followApprovalMode: parsed.data.followApprovalMode as FollowApprovalMode },
  });

  return NextResponse.json({ ok: true });
}
