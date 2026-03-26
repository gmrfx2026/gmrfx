import { prisma } from "@/lib/prisma";

/** Sumber kebenaran untuk redirect /profil vs /lengkapi-profil — jangan andalkan JWT (bisa kedaluwarsa setelah update DB). */
export async function isUserProfileComplete(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileComplete: true },
  });
  return Boolean(u?.profileComplete);
}
