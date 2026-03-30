import Link from "next/link";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MEMBER_ONLINE_WINDOW_MINUTES,
  formatMemberLastSeenRelative,
  memberOnlineCutoff,
} from "@/lib/memberPresence";

export const dynamic = "force-dynamic";

export default async function AdminMembersOnlinePage() {
  const cutoff = memberOnlineCutoff();
  const members = await prisma.user.findMany({
    where: {
      role: Role.USER,
      memberLastSeenAt: { gte: cutoff },
    },
    orderBy: { memberLastSeenAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      memberSlug: true,
      memberStatus: true,
      memberLastSeenAt: true,
    },
  });

  const now = Date.now();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Member sedang online</h1>
          <p className="mt-1 text-sm text-gray-600">
            Perkiraan berdasarkan aktivitas di situs dalam <strong>{MEMBER_ONLINE_WINDOW_MINUTES} menit</strong>{" "}
            terakhir (bukan koneksi realtime). Member harus membuka halaman dengan header situs agar waktu
            terakhir terkirim.
          </p>
        </div>
        <Link href="/admin/members" className="text-sm text-blue-600 hover:underline">
          ← Semua member
        </Link>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-700">
        Saat ini: <span className="text-green-700">{members.length}</span> member
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Profil publik</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktivitas terakhir</th>
            </tr>
          </thead>
          <tbody>
            {members.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">{u.name ?? "—"}</td>
                <td className="px-4 py-2 text-gray-700">{u.email}</td>
                <td className="px-4 py-2">
                  {u.memberSlug ? (
                    <Link
                      href={`/${u.memberSlug}`}
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      /{u.memberSlug}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2">{u.memberStatus}</td>
                <td className="px-4 py-2 text-gray-600">
                  {u.memberLastSeenAt
                    ? formatMemberLastSeenRelative(u.memberLastSeenAt, now)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          Tidak ada member dengan sinyal aktivitas dalam jendela ini. Pastikan member sudah login dan membuka
          situs (beranda, artikel, profil, dll.) setelah fitur ini aktif.
        </p>
      ) : null}
    </div>
  );
}
