import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminListFilterForm, AdminListSummary } from "@/components/admin/AdminListFilterForm";
import { AdminPaginationNav } from "@/components/admin/AdminPaginationNav";
import { AdminMtLicenseRevokeButton } from "@/components/admin/AdminMtLicenseRevokeButton";
import { parseAdminListQuery, resolvePagedWindow, buildAdminListHref } from "@/lib/adminListParams";

export const metadata: Metadata = { title: "Lisensi indikator MT — Admin GMR FX" };
export const dynamic = "force-dynamic";

const BASE_PATH = "/admin/marketplace/mt-licenses";

function fmtDT(d: Date) {
  return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function statusLabel(args: {
  licenseRevoked: boolean;
  purchaseRevoked: boolean;
  expired: boolean;
}): { text: string; className: string } {
  if (args.licenseRevoked) {
    return { text: "Dicabut", className: "bg-red-100 text-red-800" };
  }
  if (args.purchaseRevoked) {
    return { text: "Pembelian batal", className: "bg-amber-100 text-amber-900" };
  }
  if (args.expired) {
    return { text: "Kedaluwarsa", className: "bg-gray-200 text-gray-800" };
  }
  return { text: "Aktif", className: "bg-emerald-100 text-emerald-800" };
}

export default async function AdminMtLicensesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const lp = parseAdminListQuery(searchParams);
  const q = lp.q;

  const listWhere: Prisma.MtIndicatorLicenseWhereInput = q
    ? {
        OR: [
          { user: { email: { contains: q, mode: "insensitive" } } },
          { productCode: { contains: q, mode: "insensitive" } },
          { indicator: { title: { contains: q, mode: "insensitive" } } },
          { indicator: { slug: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const now = new Date();

  const [total, activeCount, revokedLicenseCount, totalAll] = await Promise.all([
    prisma.mtIndicatorLicense.count({ where: listWhere }),
    prisma.mtIndicatorLicense.count({
      where: {
        ...listWhere,
        revokedAt: null,
        expiresAt: { gt: now },
        purchase: { revokedAt: null },
      },
    }),
    prisma.mtIndicatorLicense.count({
      where: { ...listWhere, revokedAt: { not: null } },
    }),
    prisma.mtIndicatorLicense.count(),
  ]);

  const { page, skip, totalPages } = resolvePagedWindow(lp.page, lp.pageSize, total);

  const rows = await prisma.mtIndicatorLicense.findMany({
    where: listWhere,
    orderBy: { createdAt: "desc" },
    skip,
    take: lp.pageSize,
    select: {
      id: true,
      productCode: true,
      licenseKeyHint: true,
      emailNormalized: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true } },
      indicator: { select: { id: true, title: true, slug: true, mtLicenseProductCode: true } },
      purchase: { select: { revokedAt: true } },
    },
  });

  const withLicenseIndicator = await prisma.sharedIndicator.count({
    where: { mtLicenseProductCode: { not: null } },
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Lisensi indikator MT</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Key per pembelian untuk verifikasi di MetaTrader (<code className="rounded bg-gray-100 px-1">/api/mt/license/verify</code>
          ). Untuk produk <strong className="text-gray-700">Indikator GMRFX</strong>, kode &amp; masa berlaku diatur di{" "}
          <Link href="/admin/gmrfx-indicators" className="font-medium text-blue-600 hover:underline">
            admin → Indikator GMRFX
          </Link>
          ; indikator member di <strong className="text-gray-700">Profil → Indikator</strong>. Anda dapat mencabut lisensi di
          bawah.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          <Link href="/admin/gmrfx-indicators" className="font-medium text-blue-600 hover:underline">
            Indikator GMRFX
          </Link>
          {" · "}
          <Link href="/admin/marketplace/indikator" className="font-medium text-blue-600 hover:underline">
            Marketplace indikator (semua)
          </Link>
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: "Total lisensi (semua)", val: totalAll, color: "bg-blue-50 text-blue-700" },
          { label: "Hasil filter", val: total, color: "bg-slate-50 text-slate-700" },
          { label: "Aktif (filter)", val: activeCount, color: "bg-emerald-50 text-emerald-700" },
          { label: "Dicabut (filter)", val: revokedLicenseCount, color: "bg-red-50 text-red-700" },
          {
            label: "Indikator dengan kode MT",
            val: withLicenseIndicator,
            color: "bg-violet-50 text-violet-800",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s.color}`}>
            {s.val} {s.label}
          </div>
        ))}
      </div>

      <AdminListFilterForm
        actionPath={BASE_PATH}
        qDefault={q}
        perPageDefault={lp.pageSize}
        searchPlaceholder="Email, kode produk, judul/slug indikator…"
      />
      <AdminListSummary page={page} totalPages={totalPages} total={total} pageSize={lp.pageSize} />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Dibuat",
                "Produk",
                "Pembeli",
                "Indikator",
                "Berlaku s/d",
                "Cuplikan key",
                "Status",
                "Aksi",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const expired = row.expiresAt.getTime() <= now.getTime();
              const purchaseRevoked = row.purchase.revokedAt != null;
              const licenseRevoked = row.revokedAt != null;
              const st = statusLabel({ licenseRevoked, purchaseRevoked, expired });
              const canRevoke = !licenseRevoked;

              return (
                <tr key={row.id} className={licenseRevoked || purchaseRevoked ? "bg-gray-50/80" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{fmtDT(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-violet-800">{row.productCode}</span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-xs text-gray-700">
                    <div className="truncate font-medium text-gray-900">{row.user.name ?? "—"}</div>
                    <Link
                      href={buildAdminListHref("/admin/members", { q: row.user.email })}
                      className="text-blue-600 hover:underline"
                    >
                      {row.user.email}
                    </Link>
                    <div className="mt-0.5 text-[10px] text-gray-400">snap: {row.emailNormalized}</div>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-xs">
                    <Link
                      href={`/indikator/${encodeURIComponent(row.indicator.slug)}`}
                      target="_blank"
                      className="line-clamp-2 font-medium text-blue-600 hover:underline"
                    >
                      {row.indicator.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">{fmtDT(row.expiresAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.licenseKeyHint}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.className}`}>
                      {st.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AdminMtLicenseRevokeButton licenseId={row.id} disabled={!canRevoke} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  {q ? "Tidak ada lisensi cocok dengan pencarian." : "Belum ada lisensi MT tercatat."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPaginationNav path={BASE_PATH} page={page} totalPages={totalPages} perPage={lp.pageSize} q={q} />
    </div>
  );
}
