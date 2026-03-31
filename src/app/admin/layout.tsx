import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="admin-app min-h-screen bg-slate-100 text-slate-900 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/[0.04] backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex shrink-0 items-center justify-between gap-4 lg:min-w-[200px] lg:justify-start">
              <Link
                href="/admin"
                className="text-lg font-bold tracking-tight text-slate-900 transition hover:text-emerald-700"
              >
                GMR FX <span className="font-semibold text-emerald-600">Admin</span>
              </Link>
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200/80 hover:bg-emerald-50 lg:hidden"
              >
                Ke situs
              </Link>
            </div>
            <div className="min-w-0 lg:flex-1">
              <AdminNav />
            </div>
            <div className="hidden shrink-0 lg:block">
              <Link
                href="/"
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200/80 transition hover:bg-emerald-50"
              >
                Ke situs
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">{children}</main>
    </div>
  );
}
