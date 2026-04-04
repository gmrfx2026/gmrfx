import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Copy Trading — Admin GMR FX" };
export const dynamic = "force-dynamic";

function fmtDT(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtIDR(n: number) {
  return n === 0 ? "Gratis" : "Rp " + n.toLocaleString("id-ID");
}

export default async function AdminCopyTradingPage() {
  const now = new Date();

  const all = await prisma.mtCopyFollow.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      followerUser: { select: { name: true, email: true } },
      publisherUser: { select: { name: true, email: true } },
    },
  });

  const active = all.filter((r) => !r.expiresAt || r.expiresAt > now);
  const expired = all.filter((r) => r.expiresAt && r.expiresAt <= now);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Monitoring Copy Trading</h1>
        <p className="mt-0.5 text-sm text-gray-500">Pantau semua langganan copy trading — aktif maupun kadaluarsa.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {[
          { label: "Total Langganan", val: all.length, color: "bg-blue-50 text-blue-700" },
          { label: "Aktif", val: active.length, color: "bg-emerald-50 text-emerald-700" },
          { label: "Kadaluarsa", val: expired.length, color: "bg-red-50 text-red-600" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s.color}`}>
            {s.val} {s.label}
          </div>
        ))}
      </div>

      <Section title="Langganan Aktif" items={active} now={now} emptyMsg="Tidak ada langganan aktif saat ini." />
      <Section title="Kadaluarsa" items={expired} now={now} emptyMsg="Tidak ada langganan yang kadaluarsa." muted />
    </div>
  );
}

type Item = Awaited<ReturnType<typeof prisma.mtCopyFollow.findMany>>[number] & {
  followerUser: { name: string | null; email: string };
  publisherUser: { name: string | null; email: string };
};

function Section({
  title,
  items,
  now,
  emptyMsg,
  muted,
}: {
  title: string;
  items: Item[];
  now: Date;
  emptyMsg: string;
  muted?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2 className={`mb-2 text-sm font-bold uppercase tracking-wider ${muted ? "text-gray-400" : "text-gray-700"}`}>{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">{emptyMsg}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Follower", "Publisher", "MT Login", "Bayar", "Token Hint", "Mulai", "Kadaluarsa"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((r) => {
                const isExpiringSoon = r.expiresAt && r.expiresAt > now && (r.expiresAt.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
                return (
                  <tr key={r.id} className={isExpiringSoon ? "bg-amber-50/40" : ""}>
                    <td className="px-4 py-3 text-gray-800">{r.followerUser.name ?? r.followerUser.email}</td>
                    <td className="px-4 py-3 text-gray-600">{r.publisherUser.name ?? r.publisherUser.email}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{r.mtLogin}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtIDR(Number(r.paidAmountIdr))}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.copyTokenHint ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDT(r.createdAt)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {r.expiresAt ? (
                        <span className={isExpiringSoon ? "font-semibold text-amber-600" : muted ? "text-red-400" : "text-gray-500"}>
                          {fmtDT(r.expiresAt)}
                          {isExpiringSoon && " ⚠️"}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
