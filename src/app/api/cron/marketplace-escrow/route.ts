import { NextResponse } from "next/server";
import { processDueMarketplaceEscrowReleases } from "@/lib/marketplaceEscrow";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const h = req.headers.get("authorization");
  const bearer = h?.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const x = req.headers.get("x-cron-secret")?.trim() ?? "";
  return bearer === secret || x === secret;
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}

async function run(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { released } = await processDueMarketplaceEscrowReleases();
  return NextResponse.json({
    ok: true,
    released,
    at: new Date().toISOString(),
  });
}
