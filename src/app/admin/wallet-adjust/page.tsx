import { prisma } from "@/lib/prisma";
import { AdminWalletAdjustForm } from "@/components/admin/AdminWalletAdjustForm";
import { formatJakarta } from "@/lib/jakartaDateFormat";

export const dynamic = "force-dynamic";

export default async function AdminWalletAdjustPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  // Cari member untuk form
  const members = q
    ? await prisma.user.findMany({
        where: {
          OR: [
            { name:  { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true, walletBalance: true },
        take: 20,
        orderBy: { name: "asc" },
      })
    : [];

  // Riwayat 30 penyesuaian terakhir oleh admin
  const adminAdjustments = await prisma.walletTransfer.findMany({
    where: { note: { startsWith: "[ADMIN]" } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      fromUser: { select: { name: true, email: true } },
      toUser:   { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Penyesuaian Saldo Manual</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kredit (tambah) atau debit (kurangi) saldo IDR member. Setiap penyesuaian tercatat
          sebagai WalletTransfer untuk audit trail.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>⚠ Hati-hati:</strong> Tindakan ini langsung mempengaruhi saldo member dan tidak dapat
        dibatalkan kecuali dengan entri baru yang berlawanan.
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <AdminWalletAdjustForm members={members} initialQ={q} />
      </div>

      {/* Riwayat penyesuaian admin */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Riwayat penyesuaian admin (30 terakhir)</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Jumlah (IDR)</th>
                <th className="px-4 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminAdjustments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                    Belum ada penyesuaian.
                  </td>
                </tr>
              )}
              {adminAdjustments.map((t) => {
                // Kredit: admin (from) → member (to); Debit: member (from) → admin (to)
                const isCredit = t.toUser.email !== t.fromUser.email &&
                  t.note?.includes("[ADMIN]");
                const memberRow = isCredit ? t.toUser : t.fromUser;
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500">
                      {formatJakarta(t.createdAt, { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                          t.fromUser.email === t.toUser.email
                            ? "bg-gray-50 text-gray-600 ring-gray-200"
                            : "bg-green-50 text-green-700 ring-green-200"
                        }`}
                      >
                        Kredit/Debit
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-800">{memberRow.name ?? "—"}</div>
                      <div className="text-xs text-gray-500">{memberRow.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-900">
                      {Number(t.amount).toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 text-xs text-gray-600" title={t.note ?? ""}>
                      {t.note ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
