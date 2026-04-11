import { PrismaClient } from "@prisma/client";
import { loadRootEnv } from "./loadEnv";
import { seedDemoExpertAdvisors, seedDemoJobOffers } from "./seed-marketplace-extras";

loadRootEnv();

const prisma = new PrismaClient();

async function main() {
  const ea = await seedDemoExpertAdvisors(prisma);
  console.log(ea.ok ? ea.message : "EA demo:", ea.message);
  const jobs = await seedDemoJobOffers(prisma);
  console.log(jobs.ok ? jobs.message : "Penawaran demo:", jobs.message);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
