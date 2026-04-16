import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminGmrfxIndicatorsPanel } from "@/components/admin/AdminGmrfxIndicatorsPanel";
import { AdminGmrfxOfficialSellerSettings } from "@/components/admin/AdminGmrfxOfficialSellerSettings";
import {
  GMRFX_OFFICIAL_SELLER_SETTING_KEY,
  getGmrfxOfficialSellerId,
  getGmrfxOfficialSellerIdFromEnvOnly,
} from "@/lib/gmrfxOfficialSeller";

export const metadata: Metadata = { title: "Indikator GMRFX — Admin GMR FX" };
export const dynamic = "force-dynamic";

export default async function AdminGmrfxIndicatorsPage() {
  const sellerId = await getGmrfxOfficialSellerId();
  const sellerConfigured = Boolean(sellerId);

  const envUserId = getGmrfxOfficialSellerIdFromEnvOnly();
  const dbRow = await prisma.systemSetting.findUnique({
    where: { key: GMRFX_OFFICIAL_SELLER_SETTING_KEY },
  });
  const databaseUserId = dbRow?.value?.trim() || null;
  const effectiveUserId = sellerId;

  let preview: {
    id: string;
    email: string;
    name: string | null;
    hasWallet: boolean;
  } | null = null;
  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, name: true, walletAddress: true },
    });
    if (u) {
      preview = {
        id: u.id,
        email: u.email,
        name: u.name,
        hasWallet: Boolean(u.walletAddress?.trim()),
      };
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Indikator GMRFX (resmi)</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Produk muncul di menu situs <strong className="text-gray-700">Indikator → GMRFX</strong> dan di katalog umum.{" "}
          Contoh siap pakai (lisensi <code className="rounded bg-gray-100 px-1 text-xs">GMRFX_ZZ</code>, slug{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">gmrfx-zz-v321-contoh</code>) dibuat oleh seed:{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">npm run db:seed</code> atau{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">npm run db:seed:gmrfx-zz</code>.{" "}
          Lisensi pembeli dikelola di{" "}
          <Link href="/admin/marketplace/mt-licenses" className="font-medium text-blue-600 hover:underline">
            Lisensi MT indikator
          </Link>
          . Katalog semua member (bukan hanya GMRFX):{" "}
          <Link href="/admin/marketplace/indikator" className="font-medium text-blue-600 hover:underline">
            Marketplace Indikator
          </Link>
          .
        </p>
      </div>

      <AdminGmrfxOfficialSellerSettings
        initial={{
          envUserId,
          databaseUserId,
          effectiveUserId,
          envOverridesDatabase: Boolean(envUserId),
          preview,
        }}
      />

      <AdminGmrfxIndicatorsPanel sellerConfigured={sellerConfigured} />
    </div>
  );
}
