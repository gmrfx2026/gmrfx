import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CommentTarget, Role } from "@prisma/client";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { memberOnlineCutoff } from "@/lib/memberPresence";

export const dynamic = "force-dynamic";

const ACCENT_BAR = {
  emerald: "from-emerald-500 to-teal-400",
  sky: "from-sky-500 to-cyan-400",
  violet: "from-violet-500 to-purple-400",
  amber: "from-amber-500 to-orange-400",
  rose: "from-rose-500 to-pink-400",
  cyan: "from-cyan-500 to-blue-500",
} as const;

type AccentKey = keyof typeof ACCENT_BAR;

export default async function AdminHomePage() {
  const onlineCutoff = memberOnlineCutoff();
  const since7d = new Date();
  since7d.setUTCDate(since7d.getUTCDate() - 7);

  const [users, articles, pending, gallery, onlineNow, trafficVisitors7d, recentComments, newMembers] =
    await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.article.count({ where: { status: "PENDING" } }),
    prisma.galleryImage.count(),
    prisma.user.count({
      where: { role: Role.USER, memberLastSeenAt: { gte: onlineCutoff } },
    }),
    prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(DISTINCT s."visitorId")::bigint AS n
      FROM "SiteTrafficPageview" s
      WHERE s."createdAt" >= ${since7d}
    `.then((rows) => Number(rows[0]?.n ?? 0)).catch(() => 0),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        article: { select: { title: true, slug: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  const stats: {
    title: string;
    value: number;
    href: string;
    accent: AccentKey;
    icon: "users" | "signal" | "doc" | "clock" | "image" | "chart";
  }[] = [
    { title: "Member", value: users, href: "/admin/members", accent: "emerald", icon: "users" },
    {
      title: "Member online (perkiraan)",
      value: onlineNow,
      href: "/admin/members/online",
      accent: "sky",
      icon: "signal",
    },
    {
      title: "Pengunjung unik (7 hari)",
      value: trafficVisitors7d,
      href: "/admin/analytics",
      accent: "cyan",
      icon: "chart",
    },
    { title: "Artikel", value: articles, href: "/admin/articles", accent: "violet", icon: "doc" },
    { title: "Menunggu approval", value: pending, href: "/admin/articles", accent: "amber", icon: "clock" },
    { title: "Gambar galeri", value: gallery, href: "/admin/gallery", accent: "rose", icon: "image" },
  ];

  return (
    <div className="space-y-10 lg:space-y-12">
      <header className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Panel kontrol</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Dashboard</h1>
        <p className="text-base leading-relaxed text-slate-600">
          Ringkasan aktivitas situs: member, konten, dan moderasi dalam satu layar.
        </p>
      </header>

      <section aria-label="Statistik ringkas">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((s) => (
            <li key={s.title}>
              <StatCard
                title={s.title}
                value={s.value}
                href={s.href}
                accent={s.accent}
                icon={s.icon}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">Komentar terbaru</h2>
            <Link
              href="/admin/comments"
              className="shrink-0 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="p-5 sm:p-6">
            {recentComments.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada komentar.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentComments.map((c) => (
                  <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <time dateTime={c.createdAt.toISOString()}>
                        {formatJakarta(c.createdAt, { dateStyle: "short", timeStyle: "short" })}
                      </time>
                      {c.hidden ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                          Disembunyikan
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-2 font-medium text-slate-900">{c.user.name ?? "—"}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{c.content}</p>
                    {c.targetType === CommentTarget.ARTICLE && c.article ? (
                      <Link
                        href={`/artikel/${c.article.slug}`}
                        className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        {c.article.title}
                      </Link>
                    ) : (
                      <span className="mt-2 inline-block text-sm text-slate-500">Status / lainnya</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">Member baru</h2>
            <Link
              href="/admin/members"
              className="shrink-0 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
            >
              Daftar member →
            </Link>
          </div>
          <div className="p-5 sm:p-6">
            {newMembers.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {newMembers.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{u.name ?? "—"}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{u.email}</p>
                    </div>
                    <time
                      className="shrink-0 text-xs tabular-nums text-slate-400"
                      dateTime={u.createdAt.toISOString()}
                    >
                      {formatJakarta(u.createdAt, { dateStyle: "short" })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  accent,
  icon,
}: {
  title: string;
  value: number;
  href: string;
  accent: AccentKey;
  icon: "users" | "signal" | "doc" | "clock" | "image" | "chart";
}) {
  const bar = ACCENT_BAR[accent];
  return (
    <Link
      href={href}
      className="group relative flex min-h-[124px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.04] transition hover:border-emerald-300/80 hover:shadow-md hover:shadow-slate-900/[0.06]"
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${bar} opacity-90 transition group-hover:opacity-100`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-slate-600">{title}</p>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 transition group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-200/60"
          aria-hidden
        >
          <StatIcon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-4xl">{value}</p>
      <p className="mt-2 text-xs font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
        Buka halaman terkait
      </p>
    </Link>
  );
}

function StatIcon({ name }: { name: "users" | "signal" | "doc" | "clock" | "image" | "chart" }) {
  const cls = "h-5 w-5 text-slate-600";
  switch (name) {
    case "users":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.196-.394-2.296-1.058-3.184M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      );
    case "signal":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788" />
        </svg>
      );
    case "doc":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      );
    case "clock":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "image":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008H12V8.25z"
          />
        </svg>
      );
    case "chart":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      );
    default:
      return null;
  }
}
