import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarketplaceEscrowStatus } from "@prisma/client";
import { formatJakarta } from "@/lib/jakartaDateFormat";
import { AdminMarketplaceEscrowActions } from "@/components/admin/AdminMarketplaceEscrowActions";

export const dynamic = "force-dynamic";

const STATUSES: MarketplaceEscrowStatus[] = [
  MarketplaceEscrowStatus.PENDING,
  MarketplaceEscrowStatus.DISPUTED,
  MarketplaceEscrowStatus.RELEASED,
  MarketplaceEscrowStatus.REFUNDED,
];

function productLabel(row: {
  productType: string;
  indicatorPurchase: { indicator: { title: string; slug: string } } | null;
  eaPurchase: { ea: { title: string; slug: string } } | null;
}) {
  if (row.indicatorPurchase?.indicator) {
    const { title, slug } = row.indicatorPurchase.indicator;
    return { title, href: `/indikator/${slug}` };
  }
  if (row.eaPurchase?.ea) {
    const { title, slug } = row.eaPurchase.ea;
    return { title, href: `/ea/${slug}` };
  }
  return { title: row.productType, href: null as string | null };
}

export default async function AdminMarketplaceEscrowPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const raw = String(searchParams?.status ?? "").toUpperCase();
  const statusFilter = STATUSES.includes(raw as MarketplaceEscrowStatus)
    ? (raw as MarketplaceEscrowStatus)
    : undefined;

  const rows = await prisma.marketplaceEscrowHold.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      buyer: { select: { email: true, name: true } },
      seller: { select: { email: true, name: true } },
      indicatorPurchase: {
        select: { indicator: { select: { title: true, slug: true } } },
      },
      eaPurchase: {
        select: { ea: { select: { title: true, slug: true } } },
      },
    },
  });

  const base = "/admin/marketplace-escrow";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Escrow marketplace</h1>
      <p className="mt-1 text-sm text-gray-600">
        Dana pembelian indikator/EA ditahan hingga pembeli mengonfirmasi, komplain diselesaikan, atau masa komplain
        lewat (cron). Jadwalkan{" "}
        <code className="rounded bg-gray-100 px-1">GET/POST /api/cron/marketplace-escrow</code> dengan secret cron.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={base}
          className={`rounded px-3 py-1 text-sm ${!statusFilter ? "bg-gray-800 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
        >
          Semua
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`${base}?status=${s}`}
            className={`rounded px-3 py-1 text-sm ${
              statusFilter === s ? "bg-gray-800 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Produk</th>
              <th className="px-3 py-2">Jumlah</th>
              <th className="px-3 py-2">Pembeli</th>
              <th className="px-3 py-2">Penjual</th>
              <th className="px-3 py-2">Rilis otomatis</th>
              <th className="px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const p = productLabel(r);
              const amount = Number(r.amount);
              return (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {formatJakarta(r.createdAt, { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{r.status}</td>
                  <td className="max-w-[200px] px-3 py-2 text-gray-700">
                    {p.href ? (
                      <Link href={p.href} className="text-blue-600 hover:underline">
                        {p.title}
                      </Link>
                    ) : (
                      p.title
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    Rp{" "}
                    {amount.toLocaleString("id-ID", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="max-w-[160px] break-all px-3 py-2 text-gray-600">
                    {r.buyer.name ?? r.buyer.email}
                  </td>
                  <td className="max-w-[160px] break-all px-3 py-2 text-gray-600">
                    {r.seller.name ?? r.seller.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {formatJakarta(r.releaseAt, { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-3 py-2">
                    <AdminMarketplaceEscrowActions holdId={r.id} status={r.status} />
                    {r.disputeReason ? (
                      <p className="mt-2 max-w-xs text-xs text-amber-800">
                        Komplain: {r.disputeReason.slice(0, 500)}
                        {r.disputeReason.length > 500 ? "…" : ""}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">Tidak ada data.</p>
        )}
      </div>
    </div>
  );
}
