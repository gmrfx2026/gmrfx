import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { classifyPageTraffic, isLikelyBotUserAgent } from "@/lib/siteTrafficClassify";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  visitorId: z.string().min(8).max(64),
  path: z.string().min(1).max(2048),
  referrer: z.string().max(2048).optional().nullable(),
  hostname: z.string().max(255).optional().nullable(),
  utmSource: z.string().max(128).optional().nullable(),
  utmMedium: z.string().max(128).optional().nullable(),
  utmCampaign: z.string().max(256).optional().nullable(),
});

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;
  if (!origin) return true;
  try {
    const o = new URL(origin);
    return o.hostname === host.split(":")[0];
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (process.env.SITE_TRAFFIC_DISABLED === "1" || process.env.SITE_TRAFFIC_DISABLED === "true") {
    return new NextResponse(null, { status: 204 });
  }

  const ua = request.headers.get("user-agent");
  if (isLikelyBotUserAgent(ua)) {
    return new NextResponse(null, { status: 204 });
  }

  if (!originAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { visitorId, path, referrer, hostname, utmSource, utmMedium, utmCampaign } = parsed.data;
  const { entryType, referrerHost } = classifyPageTraffic({
    referrerUrl: referrer ?? null,
    siteHost: hostname ?? null,
    utmSource: utmSource ?? null,
  });

  await prisma.siteTrafficPageview.create({
    data: {
      visitorId,
      path,
      referrer: referrer?.trim() || null,
      referrerHost,
      utmSource: utmSource?.trim() || null,
      utmMedium: utmMedium?.trim() || null,
      utmCampaign: utmCampaign?.trim() || null,
      entryType,
    },
  });

  return new NextResponse(null, { status: 204 });
}
