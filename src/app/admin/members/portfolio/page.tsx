import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminListFilterForm, AdminListSummary } from "@/components/admin/AdminListFilterForm";
import { AdminPaginationNav } from "@/components/admin/AdminPaginationNav";
import { parseAdminListQuery, resolvePagedWindow } from "@/lib/adminListParams";
import { formatJakarta } from "@/lib/jakartaDateFormat";

export const dynamic = "force-dynamic";

function portfolioDataWhere(): Prisma.UserWhereInput {
  return {
    role: Role.USER,
    OR: [{ mtDeals: { some: {} } }, { mtAccountSnapshots: { some: {} } }],
  };
}

function mergeDistinctLogins(
  deals: { userId: string; mtLogin: string }[],
  snaps: { userId: string; mtLogin: string }[],
): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const { userId, mtLogin } of deals) {
    if (!sets.has(userId)) sets.set(userId, new Set());
    sets.get(userId)!.add(mtLogin);
  }
  for (const { userId, mtLogin } of snaps) {
    if (!sets.has(userId)) sets.set(userId, new Set());
    sets.get(userId)!.add(mtLogin);
  }
  const counts = new Map<string, number>();
  sets.forEach((set, uid) => counts.set(uid, set.size));
  return counts;
}

function mergeLastDataAt(
  dealMax: { userId: string; _max: { dealTime: Date | null } }[],
  snapMax: { userId: string; _max: { recordedAt: Date | null } }[],
): Map<string, Date> {
  const out = new Map<string, Date>();
  for (const r of dealMax) {
    const t = r._max.dealTime;
    if (t) out.set(r.userId, t);
  }
  for (const r of snapMax) {
    const t = r._max.recordedAt;
    if (!t) continue;
    const prev = out.get(r.userId);
    if (!prev || t > prev) out.set(r.userId, t);
  }
  return out;
}

export default async function AdminMembersPortfolioPage({
  searchParams,
}: {
  searchParams: { page?: string; perPage?: string; q?: string };
}) {
  const lp = parseAdminListQuery(searchParams as Record<string, string | string[] | undefined>);
  const q = lp.q;

  const basePortfolio = portfolioDataWhere();
  const where: Prisma.UserWhereInput = {
    AND: [
      basePortfolio,
      ...(q
        ? [
            {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            } satisfies Prisma.UserWhereInput,
          ]
        : []),
    ],
  };

  const [totalWithData, tokenOnlyCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({
      where: {
        role: Role.USER,
        mtLinkTokens: { some: { revokedAt: null } },
        NOT: {
          OR: [{ mtDeals: { some: {} } }, { mtAccountSnapshots: { some: {} } }],
        },
      },
    }),
  ]);

  const { page, skip, totalPages } = resolvePagedWindow(lp.page, lp.pageSize, totalWithData);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: lp.pageSize,
    select: {
      id: true,
      email: true,
      name: true,
      memberSlug: true,
      createdAt: true,
    },
  });

  const ids = users.map((u) => u.id);
  let loginCountByUser = new Map<string, number>();
  let lastDataByUser = new Map<string, Date>();

  if (ids.length > 0) {
    const [dealPairs, snapPairs, dealMax, snapMax] = await Promise.all([
      prisma.mtDeal.groupBy({
        by: ["userId", "mtLogin"],
        where: { userId: { in: ids } },
      }),
      prisma.mtAccountSnapshot.groupBy({
        by: ["userId", "mtLogin"],
        where: { userId: { in: ids } },
      }),
      prisma.mtDeal.groupBy({
        by: ["userId"],
        where: { userId: { in: ids } },
        _max: { dealTime: true },
      }),
      prisma.mtAccountSnapshot.groupBy({
        by: ["userId"],
        where: { userId: { in: ids } },
        _max: { recordedAt: true },
      }),
    ]);
    loginCountByUser = mergeDistinctLogins(dealPairs, snapPairs);
    lastDataByUser = mergeLastDataAt(dealMax, snapMax);
  }

  const sortedUsers = [...users].sort((a, b) => {
    const ta = lastDataByUser.get(a.id)?.getTime() ?? 0;
    const tb = lastDataByUser.get(b.id)?.getTime() ?? 0;
    if (tb !== ta) return tb - ta;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Member ber-portofolio</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Member yang sudah mengirim data MetaTrader ke situs (deal dan/atau snapshot saldo). Satu baris = satu
            akun website; kolom &quot;Akun MT&quot; = jumlah login MetaTrader berbeda yang terdeteksi.
          </p>
        </div>
        <Link href="/admin/members" className="text-sm font-medium text-green-700 hover:underline">
          ← Semua member
        </Link>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Punya data portofolio</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalWithData}</dd>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Token EA saja (belum ada deal/snapshot)</dt>
          <dd className="mt-1 text-2xl font-semibold text-gray-900">{tokenOnlyCount}</dd>
          <p className="mt-1 text-xs text-gray-500">Sudah buat token, terminal belum mengirim data ke API.</p>
        </div>
      </dl>

      <AdminListFilterForm
        actionPath="/admin/members/portfolio"
        qDefault={lp.q}
        perPageDefault={lp.pageSize}
        searchPlaceholder="Email atau nama…"
      />
      <AdminListSummary total={totalWithData} page={page} pageSize={lp.pageSize} totalPages={totalPages} />

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Akun MT</th>
              <th className="px-4 py-3">Data terakhir</th>
              <th className="px-4 py-3">Daftar situs</th>
              <th className="px-4 py-3">Portofolio</th>
              <th className="px-4 py-3">Profil</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => {
              const nLogin = loginCountByUser.get(u.id) ?? 0;
              const last = lastDataByUser.get(u.id);
              const profilHref = u.memberSlug ? `/${u.memberSlug}` : `/member/${u.id}`;
              return (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{u.email}</td>
                  <td className="px-4 py-2">{u.name ?? "—"}</td>
                  <td className="px-4 py-2 tabular-nums">{nLogin}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {last ? formatJakarta(last, { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {formatJakarta(u.createdAt, { dateStyle: "short" })}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/members/${u.id}/portfolio`} className="font-medium text-blue-600 hover:underline">
                      Dashboard
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={profilHref} className="font-medium text-green-700 hover:underline">
                      Buka
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedUsers.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">Belum ada member dengan data portofolio.</p>
      )}

      <AdminPaginationNav
        path="/admin/members/portfolio"
        page={page}
        totalPages={totalPages}
        perPage={lp.pageSize}
        q={lp.q}
      />
    </div>
  );
}
