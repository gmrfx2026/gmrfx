import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * URL lama `/member/[id]` dialihkan ke `/{memberSlug}` — halaman linimasa penuh (status, komentar, suka).
 * Supaya pengguna yang mem-bookmark `/member/...` tetap mendapat pengalaman sama seperti Facebook.
 */
export default async function MemberLegacyIdPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findFirst({
    where: {
      id: params.id,
      memberStatus: "ACTIVE",
      profileComplete: true,
    },
    select: {
      id: true,
      memberSlug: true,
    },
  });

  if (!user) notFound();

  if (user.memberSlug) {
    redirect(`/${user.memberSlug}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-sm text-broker-muted">
        Profil ini belum memiliki alamat publik (slug). Lengkapi profil atau hubungi admin.
      </p>
      <Link href="/profil" className="mt-6 inline-block text-sm font-medium text-broker-accent hover:underline">
        Ke dashboard member
      </Link>
    </div>
  );
}
