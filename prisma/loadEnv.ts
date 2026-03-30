import { config } from "dotenv";
import path from "path";

/** Memuat `.env` lalu `.env.local` (menimpa) — selaras dengan Next.js agar seed ke DB yang sama. */
export function loadRootEnv(): void {
  const root = process.cwd();
  config({ path: path.join(root, ".env") });
  config({ path: path.join(root, ".env.local"), override: true });
}
