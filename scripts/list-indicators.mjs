import { config } from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();
const rows = await prisma.sharedIndicator.findMany({
  select: {
    slug: true,
    title: true,
    published: true,
    seller: { select: { email: true, name: true } },
  },
  orderBy: { updatedAt: "desc" },
  take: 30,
});
console.log("count:", rows.length);
console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
