import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const links = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/members", label: "Member" },
  { href: "/admin/member-menu", label: "Menu member" },
  { href: "/admin/portfolio-menu", label: "Menu portofolio" },
  { href: "/admin/transfers", label: "Transfer wallet" },
  { href: "/admin/articles", label: "Artikel" },
  { href: "/admin/home-news", label: "Berita beranda" },
  { href: "/admin/affiliate-go", label: "Statistik /go" },
  { href: "/admin/comments", label: "Komentar" },
  { href: "/admin/gallery", label: "Galeri" },
  { href: "/admin/settings", label: "Pengaturan" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="admin-app min-h-screen bg-gray-100 text-gray-900">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="font-bold text-primary-700 text-green-700">GMR FX Admin</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/" className="ml-auto text-sm text-blue-600 hover:underline">
            Ke situs
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
