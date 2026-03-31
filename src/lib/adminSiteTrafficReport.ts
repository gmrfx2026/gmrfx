import { prisma } from "@/lib/prisma";
import { entryTypeLabel } from "@/lib/siteTrafficClassify";

export type TrafficDailyRow = { day: string; visitors: number; pageviews: number };
export type TrafficEntryRow = { entryType: string; count: number; label: string };
export type TrafficPathRow = { path: string; count: number };
export type TrafficHostRow = { host: string; count: number };
export type TrafficUtmRow = { source: string; medium: string; campaign: string; count: number };

function sinceDays(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Agregasi trafik untuk admin. Hari dihitung dalam zona WIB (UTC+7, tanpa DST).
 */
export async function getAdminSiteTrafficReport(days: number) {
  const since = sinceDays(days);

  const [dailyRaw, entryRaw, pathRaw, hostRaw, utmRaw, totals] = await Promise.all([
    prisma.$queryRaw<Array<{ day: Date; visitors: bigint; pageviews: bigint }>>`
      SELECT
        ((s."createdAt" + INTERVAL '7 hours'))::date AS day,
        COUNT(DISTINCT s."visitorId")::bigint AS visitors,
        COUNT(*)::bigint AS pageviews
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1 DESC
    `,
    prisma.$queryRaw<Array<{ entryType: string; c: bigint }>>`
      SELECT s."entryType", COUNT(*)::bigint AS c
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 2 DESC
    `,
    prisma.$queryRaw<Array<{ path: string; c: bigint }>>`
      SELECT s."path", COUNT(*)::bigint AS c
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 25
    `,
    prisma.$queryRaw<Array<{ referrerHost: string; c: bigint }>>`
      SELECT s."referrerHost", COUNT(*)::bigint AS c
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since} AND s."referrerHost" IS NOT NULL
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 20
    `,
    prisma.$queryRaw<
      Array<{ utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; c: bigint }>
    >`
      SELECT s."utmSource", s."utmMedium", s."utmCampaign", COUNT(*)::bigint AS c
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since} AND s."utmSource" IS NOT NULL AND TRIM(s."utmSource") <> ''
      GROUP BY 1, 2, 3
      ORDER BY 4 DESC
      LIMIT 20
    `,
    prisma.$queryRaw<Array<{ visitors: bigint; pageviews: bigint }>>`
      SELECT
        COUNT(DISTINCT s."visitorId")::bigint AS visitors,
        COUNT(*)::bigint AS pageviews
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since}
    `,
  ]);

  const daily: TrafficDailyRow[] = dailyRaw.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    visitors: Number(r.visitors),
    pageviews: Number(r.pageviews),
  }));

  const byEntry: TrafficEntryRow[] = entryRaw.map((r) => ({
    entryType: r.entryType,
    count: Number(r.c),
    label: entryTypeLabel(r.entryType),
  }));

  const topPaths: TrafficPathRow[] = pathRaw.map((r) => ({
    path: r.path,
    count: Number(r.c),
  }));

  const topHosts: TrafficHostRow[] = hostRaw.map((r) => ({
    host: r.referrerHost,
    count: Number(r.c),
  }));

  const utm: TrafficUtmRow[] = utmRaw.map((r) => ({
    source: r.utmSource ?? "",
    medium: r.utmMedium ?? "",
    campaign: r.utmCampaign ?? "",
    count: Number(r.c),
  }));

  const t0 = totals[0];
  const totalVisitors = t0 ? Number(t0.visitors) : 0;
  const totalPageviews = t0 ? Number(t0.pageviews) : 0;

  return {
    since,
    days,
    totalVisitors,
    totalPageviews,
    daily,
    byEntry,
    topPaths,
    topHosts,
    utm,
  };
}
