/**
 * Windows: hentikan semua node.exe lalu prisma generate.
 * Hanya dipakai jika db:generate normal masih EPERM (file engine terkunci).
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

function sleepMs(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {}
}

console.warn(
  "\n[prisma] db:generate:force — menghentikan semua proses node.exe di mesin ini dalam 2 detik… (Ctrl+C untuk batal)\n",
);
sleepMs(2000);

if (process.platform === "win32") {
  try {
    execSync("taskkill /F /IM node.exe", { stdio: "inherit" });
  } catch {
    /* tidak ada node — OK */
  }
} else {
  console.warn("[prisma] db:generate:force di non-Windows: jalankan prisma generate setelah Anda hentikan dev server.");
}

execSync("npx prisma generate", { stdio: "inherit", cwd: root, env: process.env });
