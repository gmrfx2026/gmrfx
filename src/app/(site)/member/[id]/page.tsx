import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommentTarget } from "@prisma/client";
import { auth } from "@/auth";
import { MemberStatusCommentForm } from "@/components/MemberStatusCommentForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MemberPublicPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findFirst({
    where: {
      id: params.id,
      memberStatus: "ACTIVE",
      profileComplete: true,
    },
    select: {
      id: true,
      name: true,
      kabupaten: true,
      profileStatus: true,
      image: true,
    },
  });

  if (!user) notFound();

  const session = await auth();

  const latestStatus = await prisma.statusEntry.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const comments = latestStatus
    ? await prisma.comment.findMany({
        where: { targetType: CommentTarget.STATUS, statusId: latestStatus.id, hidden: false },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { user: { select: { name: true } } },
      })
    : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/" className="text-xs text-broker-accent hover:underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">{user.name}</h1>
      <p className="text-sm text-broker-muted">{user.kabupaten}</p>
      {(latestStatus?.content ?? user.profileStatus) && (
        <div className="mt-6 rounded-xl border border-broker-border bg-broker-surface/40 p-4 text-sm text-broker-muted">
          {latestStatus?.content ?? user.profileStatus}
        </div>
      )}
      <h2 className="mt-10 text-sm font-semibold text-white">Komentar</h2>
      <ul className="mt-3 space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-broker-border p-3 text-sm">
            <p className="font-medium text-broker-accent">{c.user.name ?? "Member"}</p>
            <p className="text-broker-muted">{c.content}</p>
          </li>
        ))}
      </ul>
      {session?.user?.id && session.user.id !== user.id ? (
        latestStatus ? <MemberStatusCommentForm statusId={latestStatus.id} /> : null
      ) : !session ? (
        <p className="mt-6 text-sm text-broker-muted">
          <Link href="/login" className="text-broker-accent hover:underline">
            Login
          </Link>{" "}
          untuk berkomentar.
        </p>
      ) : null}
    </div>
  );
}
