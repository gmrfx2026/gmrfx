import { loadRootEnv } from "./loadEnv";
import { PrismaClient } from "@prisma/client";
import { seedGmrfxZzExample } from "./seed-gmrfx-zz-example";

loadRootEnv();

const prisma = new PrismaClient();
seedGmrfxZzExample(prisma)
  .then((r) => {
    console.log(r.ok ? r.message : r.message);
    process.exit(r.ok ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
