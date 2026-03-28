import { createHash, randomBytes } from "crypto";

const PEPPER_KEY = "MT5_TOKEN_PEPPER";

export function hashMt5ApiToken(plainToken: string): string {
  const pepper = process.env[PEPPER_KEY] ?? "gmrfx-mt5-dev-pepper-change-me";
  return createHash("sha256").update(`${pepper}:${plainToken}`, "utf8").digest("hex");
}

export function generateMt5ApiToken(): { plain: string; hash: string; hint: string } {
  const plain = randomBytes(32).toString("base64url");
  const hash = hashMt5ApiToken(plain);
  const hint = `…${plain.slice(-6)}`;
  return { plain, hash, hint };
}
