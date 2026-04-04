import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BankManager } from "./BankManager";

export const metadata: Metadata = { title: "Kelola Bank — Admin GMR FX" };
export const dynamic = "force-dynamic";

export default async function AdminWithdrawBanksPage() {
  const banks = await prisma.withdrawBankOption.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const active = banks.filter(b => b.active).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Bank Penarikan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Bank yang aktif akan ditampilkan di form member saat mengisi rekening.</p>
        </div>
        <Link href="/admin/withdrawals" className="text-sm text-green-700 hover:underline">← Pengajuan Penarikan</Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {[{ label: "Total", val: banks.length, c: "bg-blue-50 text-blue-700" }, { label: "Aktif", val: active, c: "bg-emerald-50 text-emerald-700" }, { label: "Nonaktif", val: banks.length - active, c: "bg-gray-100 text-gray-500" }].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s.c}`}>{s.val} {s.label}</div>
        ))}
      </div>

      <BankManager banks={banks} />
    </div>
  );
}
