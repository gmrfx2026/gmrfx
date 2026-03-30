import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CommunityPublishClient } from "@/components/portfolio/CommunityPublishClient";
import { loadMtCommunityPublishRows } from "@/lib/mtCommunityPublishRows";

export const dynamic = "force-dynamic";

export default async function PortfolioCommunityPublishPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profil/portfolio/community/publish");
  }

  const initialRows = await loadMtCommunityPublishRows(session.user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
          Publikasi komunitas
        </h1>
        <p className="mt-1 text-sm text-broker-muted">
          Per akun MT: aktifkan <strong className="text-white">Copy</strong>,{" "}
          <strong className="text-white">Ikuti</strong>, atau keduanya. Akun hanya muncul di{" "}
          <Link href="/profil/portfolio/community/accounts" className="text-broker-accent hover:underline">
            daftar komunitas
          </Link>{" "}
          jika salah satu layanan di atas dihidupkan. Nama di daftar: dari terminal (
          <span className="font-mono text-[10px]">tradeAccountName</span>) jika ada; jika kosong dipakai nama profil
          Anda di website.
        </p>
      </header>

      <CommunityPublishClient initialRows={initialRows} />
    </div>
  );
}
