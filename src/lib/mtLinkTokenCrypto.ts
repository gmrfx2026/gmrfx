import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Kunci enkripsi token untuk salin ulang oleh pemilik.
 * Set `MT_LINK_TOKEN_ENC_KEY` = 32 byte dalam base64 (disarankan produksi).
 * Jika kosong, diturunkan dari `MT5_TOKEN_PEPPER` (cukup untuk dev).
 */
function key32(): Buffer {
  const b64 = process.env.MT_LINK_TOKEN_ENC_KEY;
  if (b64) {
    const k = Buffer.from(b64, "base64");
    if (k.length !== 32) {
      throw new Error("MT_LINK_TOKEN_ENC_KEY harus tepat 32 byte (base64)");
    }
    return k;
  }
  const pepper = process.env.MT5_TOKEN_PEPPER ?? "gmrfx-mt5-dev-pepper-change-me";
  return createHash("sha256").update(`mt-link-enc:${pepper}`, "utf8").digest();
}

export function encryptMtLinkTokenPlain(plain: string): string {
  const key = key32();
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptMtLinkTokenPlain(blob: string): string {
  const key = key32();
  const buf = Buffer.from(blob, "base64url");
  if (buf.length < 28) throw new Error("cipher pendek");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const d = createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
