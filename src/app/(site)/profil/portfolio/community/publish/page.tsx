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
          Publikasi copy trade
        </h1>
        <p className="mt-1 text-sm text-broker-muted">
          Pilih akun MT yang sudah terhubung ke situs, lalu izinkan member lain untuk{" "}
          <strong className="text-white">Copy</strong> —{" "}
          <Link href="/profil/portfolio/community/accounts" className="text-broker-accent hover:underline">
            lihat daftar komunitas
          </Link>
          . Nama di daftar komunitas: dari terminal jika EA mengirim{" "}
          <span className="font-mono text-[10px]">tradeAccountName</span> (ACCOUNT_NAME); jika kosong, dipakai
          nama profil Anda di website.
        </p>
      </header>

      <CommunityPublishClient initialRows={initialRows} />
    </div>
  );
}
