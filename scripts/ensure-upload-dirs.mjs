/**
 * Pastikan folder unggahan VPS ada setelah `next build` (npm postbuild).
 * Menghindari gagal write jika deploy dari repo bersih tanpa public/uploads/....
 */
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "public", "uploads");

const dirs = [
  "article-images",
  "avatars",
  "eas",
  "gallery-images",
  "indicator-covers",
  "indicators",
  "news-images",
  "penawaran-attachments",
  "jobs",
];

await mkdir(root, { recursive: true });
for (const d of dirs) {
  await mkdir(path.join(root, d), { recursive: true });
}
