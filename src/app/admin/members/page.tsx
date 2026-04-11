import { Prisma } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MemberRowActions } from "@/components/admin/MemberRowActions";
import { AdminListFilterForm, AdminListSummary } from "@/components/admin/AdminListFilterForm";
import { AdminPaginationNav } from "@/components/admin/AdminPaginationNav";
import { parseAdminListQuery, resolvePagedWindow } from "@/lib/adminListParams";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: { page?: string; perPage?: string; q?: string };
}) {
  const lp = parseAdminListQuery(searchParams as Record<string, string | string[] | undefined>);
  const q = lp.q;

  const fullWhere: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { phoneWhatsApp: { contains: q, mode: "insensitive" } },
          { walletAddress: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const legacyWhere: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  async function loadMembers(where: Prisma.UserWhereInput, fullSchema: boolean) {
    const total = await prisma.user.count({ where });
    const { page, skip, totalPages } = resolvePagedWindow(lp.page, lp.pageSize, total);

    if (fullSchema) {
      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: lp.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          phoneWhatsApp: true,
          walletAddress: true,
          walletBalance: true,
          memberStatus: true,
          addressLine: true,
          kecamatan: true,
          kabupaten: true,
          provinsi: true,
          kodePos: true,
          negara: true,
          role: true,
        },
      });
      return { total, page, totalPages, users };
    }

    const users = (await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: lp.pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })).map((u) => ({
      ...u,
      phoneWhatsApp: null,
      walletAddress: null,
      walletBalance: 0,
      memberStatus: "ACTIVE",
      addressLine: null,
      kecamatan: null,
      kabupaten: null,
      provinsi: null,
      kodePos: null,
      negara: "Indonesia",
    }));

    return { total, page, totalPages, users };
  }

  let total: number;
  let page: number;
  let totalPages: number;
  let users: Awaited<ReturnType<typeof loadMembers>>["users"];

  try {
    ({ total, page, totalPages, users } = await loadMembers(fullWhere, true));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      console.warn("[admin/members] Kolom member terbaru belum tersedia di database; gunakan tampilan kompatibel.");
      ({ total, page, totalPages, users } = await loadMembers(legacyWhere, false));
    } else {
      throw error;
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengelolaan member</h1>
          <p className="mt-1 text-sm text-gray-600">Update status, saldo, wallet, kontak, dan alamat.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/members/online" className="text-sm font-medium text-green-700 hover:underline">
            Member sedang online →
          </Link>
          <Link href="/admin/members/portfolio" className="text-sm font-medium text-green-700 hover:underline">
            Member ber-portofolio →
          </Link>
        </div>
      </div>

      <AdminListFilterForm
        actionPath="/admin/members"
        qDefault={lp.q}
        perPageDefault={lp.pageSize}
        searchPlaceholder="Email, nama, HP, wallet…"
      />
      <AdminListSummary total={total} page={page} pageSize={lp.pageSize} totalPages={totalPages} />

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">HP</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">Saldo IDR</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700">{u.email}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.phoneWhatsApp}</td>
                <td className="px-4 py-2 font-mono text-xs">{u.walletAddress}</td>
                <td className="px-4 py-2">{Number(u.walletBalance).toLocaleString("id-ID")}</td>
                <td className="px-4 py-2">{u.memberStatus}</td>
                <td className="px-4 py-2">
                  <MemberRowActions
                    user={{
                      id: u.id,
                      email: u.email,
                      name: u.name,
                      phoneWhatsApp: u.phoneWhatsApp,
                      walletAddress: u.walletAddress,
                      walletBalance: Number(u.walletBalance),
                      memberStatus: u.memberStatus,
                      addressLine: u.addressLine,
                      kecamatan: u.kecamatan,
                      kabupaten: u.kabupaten,
                      provinsi: u.provinsi,
                      kodePos: u.kodePos,
                      negara: u.negara,
                      role: u.role,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPaginationNav path="/admin/members" page={page} totalPages={totalPages} perPage={lp.pageSize} q={lp.q} />
    </div>
  );
}
