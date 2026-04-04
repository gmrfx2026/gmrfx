import { prisma } from "@/lib/prisma";
import { AffiliateLinkManager } from "./AffiliateLinkManager";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateGoPage() {
  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [links, total, withVisitorId, last30, distinctVisitors, byDayRows] = await Promise.all([
    prisma.brokerAffiliateLink.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.affiliateGoClick.count(),
    prisma.affiliateGoClick.count({ where: { visitorId: { not: null } } }),
    prisma.affiliateGoClick.count({ where: { createdAt: { gte: from30 } } }),
    prisma.affiliateGoClick.findMany({
      where: { visitorId: { not: null } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
    prisma.$queryRaw<{ day: Date; c: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS c
      FROM "AffiliateGoClick"
      WHERE "createdAt" >= ${from30}
      GROUP BY 1
      ORDER BY 1 DESC
    `,
  ]);

  const uniqueEstimate = distinctVisitors.length;
  const activeCount = links.filter(l => l.active).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mitra Broker (/go)</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola link afiliasi broker yang dibuka saat member mengunjungi halaman{" "}
          <code className="rounded bg-gray-200 px-1">/go</code>, dan pantau statistik kunjungannya.
        </p>
      </div>

      {/* Ringkasan status link */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total link", val: links.length, color: "bg-blue-50 text-blue-700" },
          { label: "Aktif", val: activeCount, color: "bg-emerald-50 text-emerald-700" },
          { label: "Nonaktif", val: links.length - activeCount, color: "bg-gray-100 text-gray-500" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s.color}`}>
            {s.val} {s.label}
          </div>
        ))}
      </div>

      {/* Manajemen link */}
      <AffiliateLinkManager links={links} />

      {/* Statistik kunjungan */}
      <div>
        <h2 className="text-lg font-bold text-gray-800">Statistik Kunjungan /go</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Setiap kunjungan ke halaman <code className="rounded bg-gray-200 px-1">/go</code> dicatat sekali.
          Perkiraan &ldquo;orang&rdquo; memakai cookie pengunjung di browser.
        </p>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Total pembukaan /go", val: total },
            { label: "Perkiraan pengunjung (cookie)", val: uniqueEstimate, sub: `Event dengan cookie: ${withVisitorId}` },
            { label: "30 hari terakhir", val: last30 },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{s.val}</dd>
              {s.sub && <p className="mt-1 text-xs text-gray-500">{s.sub}</p>}
            </div>
          ))}
        </dl>

        <h3 className="mt-8 text-sm font-semibold text-gray-800">Per hari (30 hari)</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-700">Tanggal</th>
                <th className="px-4 py-2 font-medium text-gray-700">Kunjungan</th>
              </tr>
            </thead>
            <tbody>
              {byDayRows.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-500">Belum ada data.</td></tr>
              ) : (
                byDayRows.map(row => (
                  <tr key={row.day.toISOString()} className="border-b border-gray-100">
                    <td className="px-4 py-2 text-gray-800">{row.day.toLocaleDateString("id-ID", { dateStyle: "medium" })}</td>
                    <td className="px-4 py-2 text-gray-800">{String(row.c)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
