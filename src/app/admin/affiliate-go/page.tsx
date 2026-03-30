import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateGoPage() {
  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, withVisitorId, last30, distinctVisitors] = await Promise.all([
    prisma.affiliateGoClick.count(),
    prisma.affiliateGoClick.count({ where: { visitorId: { not: null } } }),
    prisma.affiliateGoClick.count({ where: { createdAt: { gte: from30 } } }),
    prisma.affiliateGoClick.findMany({
      where: { visitorId: { not: null } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
  ]);

  const byDayRows = await prisma.$queryRaw<{ day: Date; c: bigint }[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS c
    FROM "AffiliateGoClick"
    WHERE "createdAt" >= ${from30}
    GROUP BY 1
    ORDER BY 1 DESC
  `;

  const uniqueEstimate = distinctVisitors.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Statistik /go (mitra broker)</h1>
      <p className="mt-1 text-sm text-gray-600">
        Setiap kunjungan ke halaman <code className="rounded bg-gray-200 px-1">/go</code> (dari tautan di artikel)
        dicatat sekali. Perkiraan &quot;orang&quot; memakai cookie pengunjung di browser — bukan hitungan unik pasti.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Total pembukaan /go</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{total}</dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Perkiraan pengunjung (cookie)</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{uniqueEstimate}</dd>
          <p className="mt-1 text-xs text-gray-500">Event dengan cookie: {withVisitorId}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">30 hari terakhir</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{last30}</dd>
        </div>
      </dl>

      <h2 className="mt-10 text-sm font-semibold text-gray-800">Per hari (30 hari)</h2>
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
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              byDayRows.map((row) => (
                <tr key={row.day.toISOString()} className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-800">
                    {row.day.toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-2 text-gray-800">{String(row.c)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
