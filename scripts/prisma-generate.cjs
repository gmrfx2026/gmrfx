/**
 * prisma generate dengan penanganan EPERM Windows: file query_engine*.node sering terkunci
 * oleh `next dev` / proses Node lain. Skrip ini mencoba menghapus engine + .tmp lalu generate.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function sleepMs(ms) {
  if (ms <= 0) return;
  const until = Date.now() + ms;
  while (Date.now() < until) {}
}

const root = path.join(__dirname, "..");
const clientDir = path.join(root, "node_modules", ".prisma", "client");

function listEngineArtifacts() {
  if (!fs.existsSync(clientDir)) return [];
  return fs.readdirSync(clientDir).filter((name) => {
    if (!name.startsWith("query_engine")) return false;
    return (
      name.endsWith(".node") ||
      name.includes(".tmp") ||
      name.endsWith(".exe")
    );
  });
}

function removeEngineArtifacts() {
  const names = listEngineArtifacts();
  let lastErr = null;
  for (const name of names) {
    const p = path.join(clientDir, name);
    try {
      fs.unlinkSync(p);
    } catch (e) {
      lastErr = e;
    }
  }
  return { removed: names.length, lastErr };
}

const delaysMs = [0, 800, 1500, 2500, 4000];
let lastRemove = { lastErr: null };
for (let i = 0; i < delaysMs.length; i++) {
  if (delaysMs[i] > 0) {
    console.log(`[prisma] Menunggu ${delaysMs[i]}ms sebelum coba lagi menghapus engine… (${i + 1}/${delaysMs.length})`);
    sleepMs(delaysMs[i]);
  }
  lastRemove = removeEngineArtifacts();
  if (!lastRemove.lastErr) break;
}

try {
  execSync("npx prisma generate", { stdio: "inherit", cwd: root, env: process.env });
} catch (e) {
  console.error("\n[prisma] Generate gagal.");
  if (process.platform === "win32") {
    console.error(
      "Di Windows, error EPERM biasanya karena `npm run dev` atau proses Node lain masih jalan dan memegang query_engine-windows.dll.node.",
    );
    console.error("→ Hentikan dev server (Ctrl+C), lalu:  npm run db:generate");
    console.error("→ Jika masih gagal:  npm run db:generate:force  (akan menghentikan SEMUA proses node.exe)\n");
  }
  process.exit(e.status ?? 1);
}
