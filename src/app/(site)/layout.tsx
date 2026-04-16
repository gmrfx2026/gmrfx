import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingChatDock } from "@/components/chat/FloatingChatDock";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <SiteHeader />
      <main className="min-h-0 min-w-0 flex-1">{children}</main>
      <SiteFooter />
      {session?.user?.id ? <FloatingChatDock userId={session.user.id} /> : null}
    </>
  );
}
