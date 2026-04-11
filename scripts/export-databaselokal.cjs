/**
 * Export PostgreSQL (DATABASE_URL) ke file teks SQL di root repo: `databaselokal`.
 * Butuh `pg_dump` di PATH (instalasi PostgreSQL client).
 *
 *   npm run db:export:databaselokal
 *
 * Opsional: set OUT_FILE untuk path lain.
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const root = path.join(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

const raw = process.env.DATABASE_URL;
if (!raw || !String(raw).trim()) {
  console.error("DATABASE_URL kosong — isi di .env atau .env.local");
  process.exit(1);
}

let u;
try {
  u = new URL(raw.trim());
} catch {
  console.error("DATABASE_URL tidak valid sebagai URL");
  process.exit(1);
}

if (!/^postgres(ql)?:$/i.test(u.protocol)) {
  console.error('DATABASE_URL harus berawalan postgresql:// atau postgres://');
  process.exit(1);
}

const user = decodeURIComponent(u.username || "postgres");
const password = decodeURIComponent(u.password || "");
const host = u.hostname;
const port = u.port || "5432";
const database = u.pathname.replace(/^\//, "").split("/")[0].split("?")[0];
if (!database) {
  console.error("Nama database tidak terbaca dari DATABASE_URL");
  process.exit(1);
}

const outFile = path.resolve(root, process.env.OUT_FILE || "databaselokal");
const dump = spawnSync(
  "pg_dump",
  [
    "-h",
    host,
    "-p",
    port,
    "-U",
    user,
    "-d",
    database,
    "--no-owner",
    "--no-acl",
    "-F",
    "p",
    "-f",
    outFile,
  ],
  {
    env: { ...process.env, PGPASSWORD: password },
    stdio: ["ignore", "inherit", "pipe"],
    encoding: "utf8",
  }
);

if (dump.error) {
  console.error("pg_dump tidak ditemukan di PATH. Pasang PostgreSQL client atau tambahkan folder bin ke PATH.");
  console.error(dump.error.message);
  process.exit(1);
}
if (dump.status !== 0) {
  console.error(dump.stderr?.trim() || "pg_dump gagal (cek koneksi DATABASE_URL dan firewall).");
  process.exit(dump.status || 1);
}

const stat = fs.statSync(outFile);
console.log("Export OK:", outFile, "(" + stat.size + " bytes)");
