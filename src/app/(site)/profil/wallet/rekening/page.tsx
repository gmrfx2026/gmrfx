import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfilPaymentMethodForm } from "@/components/ProfilPaymentMethodForm";

export const dynamic = "force-dynamic";

export default async function WalletRekeningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-broker-muted">
        <Link href="/profil?tab=wallet" className="hover:text-white transition">
          Wallet &amp; Transfer
        </Link>
        <span>/</span>
        <span className="text-white">Rekening &amp; Dompet</span>
      </nav>

      {/* Header */}
      <div className="rounded-2xl border border-broker-border bg-broker-surface/40 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-broker-accent/10 text-2xl">
            🏦
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Rekening &amp; Dompet</h1>
            <p className="mt-1 text-sm text-broker-muted">
              Simpan rekening bank dan alamat dompet USDT yang akan digunakan saat mengajukan penarikan saldo.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProfilPaymentMethodForm />

      {/* Footer link */}
      <div className="rounded-2xl border border-broker-border/50 bg-broker-surface/20 px-5 py-4">
        <p className="text-sm text-broker-muted">
          Setelah menyimpan data rekening, Anda dapat mengajukan penarikan di halaman{" "}
          <Link href="/profil/wallet/penarikan" className="font-medium text-broker-accent hover:underline">
            Penarikan Saldo →
          </Link>
        </p>
      </div>
    </div>
  );
}
