import { PrismaClient } from "@prisma/client";
import { seedPiphunterIndicators } from "./seed-piphunter-indicators";

const prisma = new PrismaClient();
seedPiphunterIndicators(prisma)
  .then((r) => {
    console.log(r.ok ? r.message : r.message);
    process.exit(r.ok ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
