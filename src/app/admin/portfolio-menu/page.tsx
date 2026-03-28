import { AdminPortfolioMenuForm } from "@/components/admin/AdminPortfolioMenuForm";
import { getPortfolioMenuAdminRows } from "@/lib/portfolioMenu";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioMenuPage() {
  const items = await getPortfolioMenuAdminRows();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Menu portofolio member</h1>
      <p className="mt-1 text-sm text-gray-600">
        Mengatur item submenu di bawah <strong className="text-gray-800">Portofolio MT</strong> (sidebar desktop
        dan strip navigasi mobile di area <code className="rounded bg-gray-100 px-1">/profil/portfolio</code>).
        Nonaktifkan item yang tidak ingin ditampilkan kepada member.
      </p>
      <p className="mt-2 text-sm text-amber-800">
        Catatan: menonaktifkan menu tidak memblokir URL secara tegas — member masih bisa membuka alamat jika
        mengetik langsung. Untuk keamanan fitur lanjutan, tambahkan pengecekan di halaman terkait jika perlu.
      </p>
      <div className="mt-6 max-w-4xl">
        <AdminPortfolioMenuForm initialItems={items} />
      </div>
    </div>
  );
}
