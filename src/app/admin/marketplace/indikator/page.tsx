import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarketplaceActionButtons } from "../MarketplaceActionButtons";

export const metadata: Metadata = { title: "Marketplace Indikator — Admin GMR FX" };
export const dynamic = "force-dynamic";

function fmtIDR(n: number) {
  return n === 0 ? "Gratis" : "Rp " + n.toLocaleString("id-ID");
}
function fmtDT(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminIndikatorPage() {
  const items = await prisma.sharedIndicator.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true, email: true } },
      _count: { select: { purchases: true, ratings: true } },
    },
  });

  const total = items.length;
  const pub = items.filter((i) => i.published).length;
  const draft = total - pub;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Marketplace Indikator</h1>
        <p className="mt-0.5 text-sm text-gray-500">Kelola semua indikator yang diunggah oleh member.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: "Total", val: total, color: "bg-blue-50 text-blue-700" },
          { label: "Dipublikasikan", val: pub, color: "bg-emerald-50 text-emerald-700" },
          { label: "Disembunyikan", val: draft, color: "bg-yellow-50 text-yellow-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s.color}`}>
            {s.val} {s.label}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Judul", "Penjual", "Harga", "Platform", "Beli", "Rating", "Tgl Upload", "Status", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className={item.published ? "" : "bg-gray-50/60"}>
                <td className="px-4 py-3 max-w-[180px]">
                  <Link href={`/indikator/${item.slug}`} target="_blank" className="font-medium text-blue-600 hover:underline line-clamp-2">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{item.seller.name ?? item.seller.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtIDR(Number(item.priceIdr))}</td>
                <td className="px-4 py-3 text-gray-500 uppercase text-xs">{item.platform}</td>
                <td className="px-4 py-3 text-center text-gray-600">{item._count.purchases}</td>
                <td className="px-4 py-3 text-center text-gray-600">{item._count.ratings}</td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDT(item.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.published ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {item.published ? "Publik" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <MarketplaceActionButtons
                    itemId={item.id}
                    itemTitle={item.title}
                    published={item.published}
                    apiBase="/api/admin/marketplace/indikator"
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">Belum ada indikator.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
