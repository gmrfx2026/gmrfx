import { AdminPortfolioMenuForm } from "@/components/admin/AdminPortfolioMenuForm";
import { getPortfolioMenuAdminRows } from "@/lib/portfolioMenu";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioMenuPage() {
  const items = await getPortfolioMenuAdminRows();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Menu portofolio & komunitas member</h1>
      <p className="mt-1 text-sm text-gray-600">
        Mengatur label, urutan, dan aktif/nonaktif untuk submenu{" "}
        <strong className="text-gray-800">Portofolio MetaTrader</strong> (sidebar desktop saat membuka portofolio) serta
        blok <strong className="text-gray-800">Komunitas</strong> di sidebar member (Copy / Ikuti, pengikut,
        publikasi). Strip navigasi horizontal mobile di{" "}
        <code className="rounded bg-gray-100 px-1">/profil/portfolio</code> memuat item portofolio (bukan
        komunitas).
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
