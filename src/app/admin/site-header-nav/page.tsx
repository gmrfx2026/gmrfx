import { AdminSiteHeaderNavForm } from "@/components/admin/AdminSiteHeaderNavForm";
import { getSiteHeaderNavAdminRows } from "@/lib/siteHeaderNav";

export const dynamic = "force-dynamic";

export default async function AdminSiteHeaderNavPage() {
  const items = await getSiteHeaderNavAdminRows();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Menu header situs</h1>
      <p className="mt-1 text-sm text-gray-600">
        Atur label, urutan, dan item yang disembunyikan pada menu navigasi atas (desktop & mobile). Alamat URL
        tetap — tidak dapat diubah dari sini demi keamanan.
      </p>
      <div className="mt-6 max-w-5xl">
        <AdminSiteHeaderNavForm initialItems={items} />
      </div>
    </div>
  );
}
