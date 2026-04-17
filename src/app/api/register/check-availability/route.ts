import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhoneE164, phoneVariants } from "@/lib/phoneNormalize";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Validasi dasar format email — cukup untuk guard sebelum query DB. */
function isEmailLike(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
}

/** Cegah enumerasi member: 20 cek per menit per IP. Form debounce 500ms jadi user legit aman. */
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60_000;

/**
 * Cek ketersediaan email & nomor WhatsApp sebelum user klik "Daftar".
 * Public endpoint (tanpa auth) — sama dengan yang sudah ter-expose via register
 * flow (yang juga return 409 kalau bentrok), jadi tidak menambah permukaan enumerasi.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`checkavail:${ip}`, RATE_MAX, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSec),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const url = new URL(req.url);
  const emailRaw = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = (url.searchParams.get("phone") ?? "").trim();

  const result: {
    email?: { checked: true; available: boolean };
    phone?: { checked: true; available: boolean; normalized: string };
    invalid?: { email?: boolean; phone?: boolean };
  } = {};

  if (emailRaw) {
    if (!isEmailLike(emailRaw)) {
      result.invalid = { ...(result.invalid ?? {}), email: true };
    } else {
      const existing = await prisma.user.findUnique({
        where: { email: emailRaw },
        select: { id: true },
      });
      result.email = { checked: true, available: !existing };
    }
  }

  if (phoneRaw) {
    const normalized = normalizePhoneE164(phoneRaw);
    if (!normalized) {
      result.invalid = { ...(result.invalid ?? {}), phone: true };
    } else {
      const existing = await prisma.user.findFirst({
        where: { phoneWhatsApp: { in: phoneVariants(normalized) } },
        select: { id: true },
      });
      result.phone = { checked: true, available: !existing, normalized };
    }
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
