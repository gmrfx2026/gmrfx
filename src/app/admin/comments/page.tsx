import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommentTarget } from "@prisma/client";
import { AdminCommentModerationToggle } from "@/components/admin/AdminCommentModerationToggle";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      user: { select: { name: true, email: true } },
      article: { select: { title: true, slug: true } },
      status: {
        select: {
          id: true,
          userId: true,
          user: { select: { memberSlug: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Komentar</h1>
      <p className="mt-1 text-sm text-gray-600">
        Moderasi: sembunyikan dari tampilan publik tanpa menghapus data.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Pengguna</th>
              <th className="px-3 py-2">Isi</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {comments.map((c) => {
              const target =
                c.targetType === CommentTarget.ARTICLE && c.article
                  ? (
                      <Link href={`/artikel/${c.article.slug}`} className="text-blue-600 hover:underline">
                        {c.article.title}
                      </Link>
                    )
                  : c.targetType === CommentTarget.STATUS
                    ? (
                        <span className="text-gray-600">
                          Status
                          {c.status ? (
                            <>
                              {" "}
                              ·{" "}
                              <Link
                                href={
                                  c.status.user?.memberSlug
                                    ? `/${c.status.user.memberSlug}`
                                    : `/member/${c.status.userId}`
                                }
                                className="text-blue-600 hover:underline"
                              >
                                profil
                              </Link>
                            </>
                          ) : null}
                        </span>
                      )
                    : (
                        <span className="text-gray-400">—</span>
                      );

              return (
                <tr key={c.id} className={c.hidden ? "bg-amber-50/80" : ""}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" }).format(
                      c.createdAt
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{target}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    <span className="font-medium">{c.user.name ?? "—"}</span>
                    <br />
                    <span className="text-gray-500">{c.user.email}</span>
                  </td>
                  <td className="max-w-md px-3 py-2 text-xs text-gray-800">
                    <p className="line-clamp-3 whitespace-pre-wrap">{c.content}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-gray-500">{c.hidden ? "Disembunyikan" : "Publik"}</span>
                      <AdminCommentModerationToggle id={c.id} initialHidden={c.hidden} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {comments.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">Belum ada komentar.</p>
      )}
    </div>
  );
}
