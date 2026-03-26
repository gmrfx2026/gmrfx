const { PrismaClient, CommentTarget } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      profileStatus: { not: null },
    },
    select: {
      id: true,
      name: true,
      profileStatus: true,
    },
  });

  let updated = 0;

  for (const u of users) {
    const existing = await prisma.statusEntry.findFirst({
      where: { userId: u.id },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (existing) continue;

    const entry = await prisma.statusEntry.create({
      data: {
        userId: u.id,
        content: u.profileStatus,
      },
    });

    await prisma.comment.updateMany({
      where: {
        targetType: CommentTarget.STATUS,
        statusOwnerId: u.id,
        statusId: null,
      },
      data: { statusId: entry.id },
    });

    updated++;
    console.log(`Backfilled: ${u.name ?? u.id} -> StatusEntry ${entry.id}`);
  }

  console.log(`Selesai. Backfilled entries: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};

