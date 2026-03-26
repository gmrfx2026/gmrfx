import { auth } from "@/auth";
import { MemberSidebar } from "@/components/member/MemberSidebar";
import { getResolvedMemberMenuItems } from "@/lib/memberMenu";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function ProfilLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil");
  if (!session.user.profileComplete) redirect("/lengkapi-profil");

  const menuItems = await getResolvedMemberMenuItems();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex gap-6">
        <MemberSidebar items={menuItems} />
        <div className="min-w-0 flex-1 pb-[5.75rem] md:pb-0">{children}</div>
      </div>
    </div>
  );
}

