import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProfilWithdrawPanel } from "@/components/ProfilWithdrawPanel";

export const dynamic = "force-dynamic";

export default async function WalletPenarikanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true, bankName: true, bankAccountNumber: true, usdtWithdrawAddress: true },
  });
  if (!user) redirect("/login");

  const bal = Number(user.walletBalance);
  const hasPaymentMethod = !!(user.bankName && user.bankAccountNumber) || !!user.usdtWithdrawAddress;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-broker-muted">
        <Link href="/profil?tab=wallet" className="hover:text-white transition">
          Wallet &amp; Transfer
        </Link>
        <span>/</span>
        <span className="text-white">Penarikan Saldo</span>
      </nav>

      {/* Header */}
      <div className="rounded-2xl border border-broker-border bg-broker-surface/40 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-broker-accent/10 text-2xl">
              📤
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Penarikan Saldo</h1>
              <p className="mt-1 text-sm text-broker-muted">
                Ajukan penarikan ke rekening bank atau dompet USDT. Diproses dalam 1×24 jam kerja.
              </p>
            </div>
          </div>
          {/* Saldo chip */}
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-broker-muted">Saldo</p>
            <p className="mt-0.5 text-lg font-bold text-broker-accent">
              Rp {bal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Warning jika belum punya rekening */}
      {!hasPaymentMethod && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-300">Rekening belum diatur</p>
            <p className="mt-0.5 text-xs text-amber-200/70">
              Simpan data rekening bank atau dompet USDT terlebih dahulu di halaman{" "}
              <Link href="/profil/wallet/rekening" className="font-semibold underline hover:opacity-80">
                Rekening &amp; Dompet
              </Link>{" "}
              sebelum mengajukan penarikan.
            </p>
          </div>
        </div>
      )}

      {/* Panel penarikan */}
      <ProfilWithdrawPanel walletBalance={bal} />
    </div>
  );
}
