import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const cols = await p.$queryRawUnsafe<
  { column_name: string }[]
>(
  `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'MtAccountSnapshot' ORDER BY column_name`
);

const allNames = cols.map((c) => c.column_name);
const brokerCols = allNames.filter((n) => /broker/i.test(n));

console.log("Semua kolom MtAccountSnapshot:", allNames.join(", "));

const sample = await p.$queryRawUnsafe<
  { brokerName: string | null; brokerServer: string | null; recordedAt: Date }[]
>(
  `SELECT "brokerName", "brokerServer", "recordedAt" FROM "MtAccountSnapshot" ORDER BY "recordedAt" DESC LIMIT 8`
);

console.log("Kolom yang mengandung 'broker':", brokerCols.join(", ") || "(tidak ada)");
if (sample.length === 0) {
  console.log("Belum ada satupun baris di MtAccountSnapshot (EA belum pernah mengirim snapshot ke DB ini).");
} else {
  console.log("Contoh snapshot terakhir (brokerName / brokerServer):");
  for (const row of sample) {
    console.log(
      `  ${row.recordedAt.toISOString()} | broker="${row.brokerName ?? ""}" server="${row.brokerServer ?? ""}"`
    );
  }
  const nonNull = sample.filter((r) => r.brokerName || r.brokerServer).length;
  if (nonNull === 0) {
    console.log(
      "\nCatatan: kolom ada tetapi nilai broker/server masih NULL — pakai EA GMRFX_TradeLogger 1.03+ lalu sinkron sekali."
    );
  }
}

await p.$disconnect();
