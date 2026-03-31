import Link from "next/link";
import { getAdminSiteTrafficReport } from "@/lib/adminSiteTrafficReport";

export const dynamic = "force-dynamic";

const DAY_OPTIONS = [7, 30, 90] as const;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const raw = searchParams?.days;
  const n = raw ? Number.parseInt(raw, 10) : 30;
  const days: (typeof DAY_OPTIONS)[number] =
    n === 7 || n === 30 || n === 90 ? n : 30;

  const report = await getAdminSiteTrafficReport(days);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trafik situs</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Ringkasan kunjungan dari <strong className="text-gray-800">pelacakan first-party</strong> (peramban
            pengunjung). Kategori &quot;Google&quot; memakai <em>referrer</em> HTTP — bukan pengganti{" "}
            <a
              href="https://search.google.com/search-console"
              className="text-green-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Search Console
            </a>{" "}
            atau Google Analytics. Bagikan tautan dengan parameter{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">utm_source</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">utm_medium</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">utm_campaign</code> untuk melacak kampanye.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}`}
              className={
                d === days
                  ? "rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200"
                  : "rounded-lg px-3 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }
            >
              {d} hari
            </Link>
          ))}
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Pengunjung unik ({days} hari)</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{report.totalVisitors.toLocaleString("id-ID")}</dd>
          <p className="mt-1 text-xs text-gray-500">Berdasarkan cookie anonim di perangkat.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Tayangan halaman</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{report.totalPageviews.toLocaleString("id-ID")}</dd>
          <p className="mt-1 text-xs text-gray-500">Setiap navigasi route yang dilaporkan peramban.</p>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800">Harian (WIB)</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Pengunjung unik</th>
                <th className="px-4 py-2">Tayangan</th>
              </tr>
            </thead>
            <tbody>
              {report.daily.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Belum ada data. Kunjungi situs dari peramban biasa (bukan bot); data muncul setelah beberapa
                    kunjungan.
                  </td>
                </tr>
              ) : (
                report.daily.map((r) => (
                  <tr key={r.day} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono text-gray-800">{r.day}</td>
                    <td className="px-4 py-2 tabular-nums">{r.visitors.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-2 tabular-nums">{r.pageviews.toLocaleString("id-ID")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-gray-800">Sumber (kategori)</h2>
          <ul className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
            {report.byEntry.length === 0 ? (
              <li className="text-gray-500">—</li>
            ) : (
              report.byEntry.map((r) => (
                <li key={r.entryType} className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-700">{r.label}</span>
                  <span className="shrink-0 tabular-nums font-medium text-gray-900">{r.count.toLocaleString("id-ID")}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800">Domain rujukan (referrer)</h2>
          <p className="mt-1 text-xs text-gray-500">Hanya kunjungan yang membawa header referrer ke domain asal.</p>
          <ul className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
            {report.topHosts.length === 0 ? (
              <li className="text-gray-500">—</li>
            ) : (
              report.topHosts.map((r) => (
                <li key={r.host} className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <span className="break-all font-mono text-xs text-gray-800">{r.host}</span>
                  <span className="shrink-0 tabular-nums font-medium text-gray-900">{r.count.toLocaleString("id-ID")}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800">Halaman teratas</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Path</th>
                <th className="px-4 py-2">Tayangan</th>
              </tr>
            </thead>
            <tbody>
              {report.topPaths.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-gray-500">
                    —
                  </td>
                </tr>
              ) : (
                report.topPaths.map((r) => (
                  <tr key={r.path} className="border-b border-gray-100">
                    <td className="max-w-xl truncate px-4 py-2 font-mono text-xs text-gray-800" title={r.path}>
                      {r.path}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{r.count.toLocaleString("id-ID")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800">Kampanye UTM</h2>
        <p className="mt-1 text-xs text-gray-500">Hanya hit yang menyertakan utm_source di URL.</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">utm_source</th>
                <th className="px-4 py-2">utm_medium</th>
                <th className="px-4 py-2">utm_campaign</th>
                <th className="px-4 py-2">Hit</th>
              </tr>
            </thead>
            <tbody>
              {report.utm.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-gray-500">
                    Belum ada kunjungan dengan UTM. Contoh:{" "}
                    <span className="font-mono text-xs">
                      /artikel/slug?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=jadwal
                    </span>
                  </td>
                </tr>
              ) : (
                report.utm.map((r, i) => (
                  <tr key={`${r.source}-${r.medium}-${r.campaign}-${i}`} className="border-b border-gray-100">
                    <td className="px-4 py-2">{r.source || "—"}</td>
                    <td className="px-4 py-2">{r.medium || "—"}</td>
                    <td className="px-4 py-2">{r.campaign || "—"}</td>
                    <td className="px-4 py-2 tabular-nums">{r.count.toLocaleString("id-ID")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        Nonaktifkan pencatatan (mis. lokal): set environment{" "}
        <code className="rounded bg-white px-1">SITE_TRAFFIC_DISABLED=1</code>. Bot umum difilter lewat User-Agent;
        crawler tetap bisa muncul jika tidak terdaftar.
      </p>
    </div>
  );
}
