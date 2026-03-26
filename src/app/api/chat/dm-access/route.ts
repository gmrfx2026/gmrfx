import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrivateDmAccess } from "@/lib/chatDmAccess";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const peerId = new URL(req.url).searchParams.get("peerId");
  if (!peerId) {
    return NextResponse.json({ error: "peerId wajib" }, { status: 400 });
  }

  const dmAccess = await getPrivateDmAccess(session.user.id, peerId);
  return NextResponse.json(dmAccess);
}
