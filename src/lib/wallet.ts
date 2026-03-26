import type { PrismaClient } from "@prisma/client";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

type DbWithUser = Pick<PrismaClient, "user">;

/** Format: 2 huruf + 5 angka, unik di database */
export async function generateUniqueWalletAddress(
  db: DbWithUser
): Promise<string> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const a = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const b = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const n = String(Math.floor(10000 + Math.random() * 90000));
    const addr = `${a}${b}${n}`;
    const exists = await db.user.findUnique({ where: { walletAddress: addr } });
    if (!exists) return addr;
  }
  throw new Error("Gagal membuat alamat wallet unik");
}

export async function ensureWalletForUser(
  db: PrismaClient,
  userId: string
): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User tidak ditemukan");
  if (user.walletAddress) return user.walletAddress;
  const walletAddress = await generateUniqueWalletAddress(db);
  await db.user.update({
    where: { id: userId },
    data: { walletAddress },
  });
  return walletAddress;
}
