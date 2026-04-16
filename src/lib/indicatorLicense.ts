import { createHash, randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { encryptMtLinkTokenPlain } from "@/lib/mtLinkTokenCrypto";

const PEPPER_ENV = "INDICATOR_LICENSE_PEPPER";

export function normalizeLicenseEmail(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKC");
}

export function hashIndicatorLicenseKey(plainKey: string): string {
  const pepper = process.env[PEPPER_ENV] ?? process.env.MT5_TOKEN_PEPPER ?? "gmrfx-mt5-dev-pepper-change-me";
  return createHash("sha256").update(`${pepper}:indicator-license:${plainKey}`, "utf8").digest("hex");
}

function licensePlainToken(): string {
  return randomBytes(28).toString("base64url");
}

export function normalizeMtLicenseProductCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
  if (s.length === 0) return null;
  if (s.length > 64) return null;
  return s;
}

export function parseMtLicenseValidityDays(raw: FormDataEntryValue | null | undefined): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 3650) return null;
  return n;
}

type Tx = Prisma.TransactionClient;

export async function createIndicatorMtLicenseTx(
  tx: Tx,
  args: {
    purchaseId: string;
    buyerId: string;
    buyerEmail: string;
    indicatorId: string;
    productCode: string;
    validityDays: number;
  }
): Promise<void> {
  const expiresAt = new Date(Date.now() + args.validityDays * 86400000);
  for (let attempt = 0; attempt < 5; attempt++) {
    const plain = licensePlainToken();
    const licenseKeyHash = hashIndicatorLicenseKey(plain);
    const licenseKeyCipher = encryptMtLinkTokenPlain(plain);
    const licenseKeyHint = `…${plain.slice(-6)}`;
    try {
      await tx.mtIndicatorLicense.create({
        data: {
          productCode: args.productCode,
          licenseKeyHash,
          licenseKeyCipher,
          licenseKeyHint,
          emailNormalized: normalizeLicenseEmail(args.buyerEmail),
          userId: args.buyerId,
          indicatorId: args.indicatorId,
          purchaseId: args.purchaseId,
          expiresAt,
        },
      });
      return;
    } catch (e) {
      const dup =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: string }).code === "P2002";
      if (!dup || attempt === 4) throw e;
    }
  }
}
