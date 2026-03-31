import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  deleteUserPortfolioMtAccount,
  parseMtLoginParam,
  userOwnsPortfolioMtLogin,
} from "@/lib/portfolioMtAccountDelete";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const mtLogin = parseMtLoginParam(
    typeof body === "object" && body !== null && "mtLogin" in body
      ? (body as { mtLogin?: unknown }).mtLogin
      : null
  );
  if (!mtLogin) {
    return NextResponse.json({ error: "mtLogin tidak valid" }, { status: 400 });
  }

  const userId = session.user.id;
  const owned = await userOwnsPortfolioMtLogin(userId, mtLogin);
  if (!owned) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau sudah kosong" }, { status: 404 });
  }

  await deleteUserPortfolioMtAccount(userId, mtLogin);

  return NextResponse.json({ ok: true });
}
