import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const MemberArticleForm = dynamic(
  () => import("@/components/MemberArticleForm").then((m) => m.MemberArticleForm),
  { ssr: false, loading: () => <p className="text-sm text-broker-muted">Memuat editor…</p> }
);

export default async function ProfilArtikelBaruPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Tulis artikel</h1>
        <p className="mt-2 text-sm text-broker-muted">
          Gunakan <strong>Kutipan</strong>, <strong>1. List</strong>, <strong>—</strong>,{" "}
          <strong>Tabel</strong> (+Baris / +Kolom / Hps tbl), dan <strong>Gambar</strong> (JPG/PNG/WebP, maks. 2,5
          MB). HTML dibersihkan di server. Menunggu persetujuan admin.
        </p>
      </div>
      <div className="pt-2">
        <MemberArticleForm />
      </div>
    </div>
  );
}
