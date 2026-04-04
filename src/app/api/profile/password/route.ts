import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");

  if (!currentPassword) {
    return NextResponse.json({ error: "Password saat ini wajib diisi" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Konfirmasi password baru tidak cocok" }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "Password baru tidak boleh sama dengan password saat ini" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Akun ini menggunakan login Google — tidak memiliki password yang bisa diubah" },
      { status: 400 }
    );
  }

  const isCurrentCorrect = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentCorrect) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
