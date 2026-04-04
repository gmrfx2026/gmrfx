import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { GoOutClient } from "./GoOutClient";

export const metadata: Metadata = {
  title: "Mitra broker — GMR FX",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GoPage() {
  const links = await prisma.brokerAffiliateLink.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { url: true },
  });

  const brokerUrls = links.map((l) => l.url);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <Suspense fallback={<p className="text-center text-sm text-zinc-400">Memuat…</p>}>
        <GoOutClient brokerUrls={brokerUrls} />
      </Suspense>
    </div>
  );
}
