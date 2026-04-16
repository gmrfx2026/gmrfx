import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, HomeNewsStatus } from "@prisma/client";

const BASE = "https://gmrfx.app";

// Halaman statis publik
const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE,                          changeFrequency: "daily",   priority: 1.0 },
  { url: `${BASE}/artikel`,             changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE}/berita`,              changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE}/indikator`,           changeFrequency: "weekly",  priority: 0.8 },
  { url: `${BASE}/indikator/gmrfx`,     changeFrequency: "weekly",  priority: 0.85 },
  { url: `${BASE}/ea`,                  changeFrequency: "weekly",  priority: 0.8 },
  { url: `${BASE}/penawaran`,           changeFrequency: "daily",   priority: 0.7 },
  { url: `${BASE}/galeri`,              changeFrequency: "weekly",  priority: 0.6 },
  { url: `${BASE}/cara-pemakaian`,      changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/faq`,                 changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/kebijakan-privasi`,   changeFrequency: "yearly",  priority: 0.3 },
  { url: `${BASE}/syarat-ketentuan`,    changeFrequency: "yearly",  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [articles, news, indicators, eas, galleries, openJobs] = await Promise.all([
      prisma.article.findMany({
        where: { status: ArticleStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.homeNewsItem.findMany({
        where: { status: HomeNewsStatus.PUBLISHED },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.sharedIndicator.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 300,
      }),
      prisma.sharedExpertAdvisor.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 300,
      }),
      prisma.galleryCategory.findMany({
        select: { slug: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.jobOffer.findMany({
        where: { status: "OPEN" },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);

    return [
      ...staticRoutes,

      ...articles.map((a) => ({
        url: `${BASE}/artikel/${encodeURIComponent(a.slug)}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),

      ...news.map((n) => ({
        url: `${BASE}/berita/${encodeURIComponent(n.slug)}`,
        lastModified: n.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),

      ...indicators.map((i) => ({
        url: `${BASE}/indikator/${encodeURIComponent(i.slug)}`,
        lastModified: i.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),

      ...eas.map((e) => ({
        url: `${BASE}/ea/${encodeURIComponent(e.slug)}`,
        lastModified: e.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),

      ...galleries.map((g) => ({
        url: `${BASE}/galeri/${encodeURIComponent(g.slug)}`,
        lastModified: g.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),

      ...openJobs.map((j) => ({
        url: `${BASE}/penawaran/${j.id}`,
        lastModified: j.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // Build / prerender tetap jalan bila DB tidak tersedia (CI, quota, dsb.)
    return staticRoutes;
  }
}
