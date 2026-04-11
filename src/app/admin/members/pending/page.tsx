import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MemberStatus, Prisma } from "@prisma/client";
import { AdminActivateButton } from "./AdminActivateButton";

export const metadata: Metadata = { title: "Member Belum Aktif — Admin GMR FX" };
export const dynamic = "force-dynamic";

function fmtDT(d: Date) {
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function MemberPendingPage() {
  const members = await (async () => {
    try {
      return await prisma.user.findMany({
        where: { memberStatus: MemberStatus.PENDING },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, phoneWhatsApp: true, createdAt: true },
      });
    } catch (error) {
      const isPendingEnumUnavailable =
        error instanceof Prisma.PrismaClientUnknownRequestError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2021" || error.code === "P2022"));

      if (isPendingEnumUnavailable) {
        console.warn("[admin/members/pending] Enum/status PENDING belum tersedia di database; tampilkan daftar kosong.");
        return [];
      }
      throw error;
    }
  })();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Member Belum Aktif</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Akun yang sudah mendaftar namun belum memverifikasi nomor WhatsApp.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${members.length > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
          {members.length} akun
        </span>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
          Tidak ada akun yang tertunda verifikasi.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Nama", "Email", "No. WhatsApp", "Daftar", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-amber-50/30">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phoneWhatsApp ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDT(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminActivateButton memberId={m.id} memberName={m.name ?? m.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        Aktivasi manual digunakan jika member tidak menerima OTP WhatsApp. Pastikan nomor yang terdaftar sudah benar sebelum mengaktifkan.
      </p>
    </div>
  );
}
