import { AdminMemberMenuForm } from "@/components/admin/AdminMemberMenuForm";
import { getMemberMenuAdminRows } from "@/lib/memberMenu";

export const dynamic = "force-dynamic";

export default async function AdminMemberMenuPage() {
  const items = await getMemberMenuAdminRows();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Menu member</h1>
      <p className="mt-1 text-sm text-gray-600">
        Atur label, urutan tampil, dan item yang disembunyikan di sidebar area profil member.
      </p>
      <div className="mt-6 max-w-3xl">
        <AdminMemberMenuForm initialItems={items} />
      </div>
    </div>
  );
}
