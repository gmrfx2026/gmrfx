import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getSiteName } from "@/lib/siteNameSettings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const siteName = await getSiteName();

  return (
    <div className="admin-app min-h-screen bg-slate-100 text-slate-900 antialiased">
      <AdminSidebar siteName={siteName} />

      {/* Content — offset by sidebar width on desktop */}
      <div className="lg:pl-56">
        {/* Desktop top bar */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm shadow-slate-900/[0.03]">
          {/* Breadcrumb / page title filled by children via portal if needed — left intentionally minimal */}
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Panel Admin</span>
          <span className="text-xs text-slate-400">
            {session.user.name ?? session.user.email}
          </span>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
