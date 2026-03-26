import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMemberMenuAdminRows, saveMemberMenuFromAdmin } from "@/lib/memberMenu";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await getMemberMenuAdminRows();
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const items = body?.items;
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Body harus berisi items (array)" }, { status: 400 });
    }
    await saveMemberMenuFromAdmin(items);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gagal menyimpan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
