/**
 * Export PostgreSQL (DATABASE_URL) ke file `databaselokal` di root repo (SQL teks).
 *
 * 1) pg_dump di PATH
 * 2) pg_dump.exe di PostgreSQL\*\bin (Windows)
 * 3) Docker image postgres:16 + bind mount folder project
 *
 *   npm run db:export:databaselokal
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

const outRel = process.env.OUT_FILE || "databaselokal";
const outFile = path.isAbsolute(outRel) ? path.normalize(outRel) : path.resolve(root, outRel);
const outDir = path.dirname(outFile);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function findPgDumpWindows() {
  if (process.platform !== "win32") return null;
  const bases = [
    path.join(process.env["ProgramFiles"] || "C:\\Program Files", "PostgreSQL"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "PostgreSQL"),
  ];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    let dirs;
    try {
      dirs = fs.readdirSync(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const exe = path.join(base, d.name, "bin", "pg_dump.exe");
      if (fs.existsSync(exe)) return exe;
    }
  }
  return null;
}

function runPgDump(cmd, args) {
  return spawnSync(cmd, args, {
    env: { ...process.env, PGPASSWORD: password },
    stdio: ["ignore", "inherit", "pipe"],
    encoding: "utf8",
  });
}

const baseArgs = [
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
];

let dump = runPgDump("pg_dump", baseArgs);
if (dump.error) {
  const winExe = findPgDumpWindows();
  if (winExe) {
    console.log("Menggunakan:", winExe);
    dump = runPgDump(winExe, baseArgs);
  }
}

if (!dump.error && dump.status === 0) {
  const stat = fs.statSync(outFile);
  console.log("Export OK:", outFile, "(" + stat.size + " bytes)");
  process.exit(0);
}

if (!dump.error && dump.status !== 0) {
  console.error(dump.stderr?.trim() || "pg_dump gagal.");
  process.exit(dump.status || 1);
}

/* dump.error: pg_dump tidak ada → coba Docker */
const dockerCheck = spawnSync("docker", ["info"], { encoding: "utf8", stdio: "pipe" });
if (dockerCheck.status !== 0) {
  console.error(
    "pg_dump tidak ditemukan dan Docker tidak tersedia.\n" +
      "Pasang PostgreSQL CLI atau jalankan Docker Desktop."
  );
  if (dump.error) console.error(dump.error.message);
  process.exit(1);
}

const rootReal = path.resolve(root);
if (!outFile.startsWith(rootReal + path.sep) && outFile !== rootReal) {
  console.error(
    "Tanpa pg_dump lokal, export via Docker membutuhkan OUT_FILE di dalam folder project.\n" +
      `Contoh: OUT_FILE=databaselokal   (bukan path di luar ${rootReal})`
  );
  process.exit(1);
}

const inContainerPath = "/dumpout/" + path.relative(root, outFile).split(path.sep).join("/");
console.log("Menggunakan Docker (postgres:16) untuk pg_dump…");
dump = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-e",
    `PGPASSWORD=${password}`,
    "-v",
    `${rootReal}:/dumpout`,
    "postgres:16",
    "pg_dump",
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
    inContainerPath,
  ],
  { stdio: ["ignore", "inherit", "pipe"], encoding: "utf8" }
);

if (dump.status !== 0) {
  console.error(
    dump.stderr?.trim() ||
      "Docker pg_dump gagal (pastikan DB bisa dijangkau dari container, mis. host bukan localhost mesin Anda)."
  );
  process.exit(dump.status || 1);
}

const stat = fs.statSync(outFile);
console.log("Export OK:", outFile, "(" + stat.size + " bytes)");
