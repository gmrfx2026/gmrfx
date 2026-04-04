import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WithdrawConfigForm } from "./WithdrawConfigForm";

export const metadata: Metadata = { title: "Pengaturan Penarikan — Admin GMR FX" };
export const dynamic = "force-dynamic";

export default async function AdminWithdrawSettingsPage() {
  const cfg = await prisma.withdrawConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", updatedAt: new Date() },
  });

  const initial = {
    withdrawEnabled: cfg.withdrawEnabled,
    bankEnabled: cfg.bankEnabled,
    usdtEnabled: cfg.usdtEnabled,
    minAmountIdr: cfg.minAmountIdr,
    maxAmountIdr: cfg.maxAmountIdr,
    bankFeeIdr: cfg.bankFeeIdr,
    usdtFeeIdr: cfg.usdtFeeIdr,
    usdtNetwork: cfg.usdtNetwork,
    processingNote: cfg.processingNote,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengaturan Penarikan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Konfigurasi global untuk fitur penarikan saldo — limit, biaya, dan status aktif.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/withdrawals/banks" className="text-green-700 hover:underline">Kelola Bank</Link>
          <span className="text-gray-300">|</span>
          <Link href="/admin/withdrawals" className="text-green-700 hover:underline">← Pengajuan</Link>
        </div>
      </div>

      {!cfg.withdrawEnabled && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          ⚠ Penarikan saldo sedang <strong>dinonaktifkan</strong>. Member tidak bisa mengajukan penarikan.
        </div>
      )}

      <WithdrawConfigForm initial={initial} />
    </div>
  );
}
