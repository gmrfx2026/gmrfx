const { PrismaClient } = require("@prisma/client");
const { toMemberSlug } = require("../src/lib/memberSlug");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { memberSlug: null },
    select: { id: true, name: true, email: true, memberStatus: true },
  });

  if (users.length === 0) {
    console.log("Tidak ada user dengan memberSlug null.");
    return;
  }

  for (const u of users) {
    const slug = toMemberSlug(u.name, u.id);
    await prisma.user.update({
      where: { id: u.id },
      data: { memberSlug: slug },
    });
    console.log(`Updated: ${u.name ?? u.email} -> ${slug}`);
  }
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

