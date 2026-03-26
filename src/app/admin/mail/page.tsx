import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AdminMailPanel } from "@/components/admin/AdminMailPanel";
import { AdminListFilterForm, AdminListSummary } from "@/components/admin/AdminListFilterForm";
import { AdminPaginationNav } from "@/components/admin/AdminPaginationNav";
import { parseAdminListQuery, resolvePagedWindow } from "@/lib/adminListParams";

export const dynamic = "force-dynamic";

export default async function AdminMailPage({
  searchParams,
}: {
  searchParams: { page?: string; perPage?: string; q?: string };
}) {
  const session = await auth();
  const admin = await prisma.user.findFirst({
    where: { id: session!.user!.id },
  });
  if (!admin) return null;

  const lp = parseAdminListQuery(searchParams as Record<string, string | string[] | undefined>);

  const mailWhere: Prisma.InternalMailWhereInput = {
    toUserId: admin.id,
    ...(lp.q
      ? {
          OR: [
            { subject: { contains: lp.q, mode: "insensitive" } },
            { body: { contains: lp.q, mode: "insensitive" } },
            {
              fromUser: {
                OR: [
                  { email: { contains: lp.q, mode: "insensitive" } },
                  { name: { contains: lp.q, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const inboxTotal = await prisma.internalMail.count({ where: mailWhere });
  const { page: inboxPage, skip, totalPages: inboxTotalPages } = resolvePagedWindow(
    lp.page,
    lp.pageSize,
    inboxTotal
  );

  const inbox = await prisma.internalMail.findMany({
    where: mailWhere,
    orderBy: { createdAt: "desc" },
    skip,
    take: lp.pageSize,
    include: { fromUser: { select: { name: true, email: true } } },
  });

  const members = await prisma.user.findMany({
    where: { id: { not: admin.id }, memberStatus: "ACTIVE" },
    orderBy: { email: "asc" },
    take: 200,
    select: { id: true, email: true, name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Surat</h1>
      <p className="mt-1 text-sm text-gray-600">
        Member mengirim ke alamat <strong>admin</strong>. Balas lewat pilihan member di bawah.
      </p>

      <AdminListFilterForm
        actionPath="/admin/mail"
        qDefault={lp.q}
        perPageDefault={lp.pageSize}
        searchPlaceholder="Subjek, isi, pengirim…"
      />
      <AdminListSummary
        total={inboxTotal}
        page={inboxPage}
        pageSize={lp.pageSize}
        totalPages={inboxTotalPages}
      />

      <AdminMailPanel
        inbox={inbox.map((m) => ({
          id: m.id,
          subject: m.subject,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          fromLabel: m.fromUser.name ?? m.fromUser.email ?? "",
        }))}
        members={members}
        inboxFooter={
          <AdminPaginationNav
            path="/admin/mail"
            page={inboxPage}
            totalPages={inboxTotalPages}
            perPage={lp.pageSize}
            q={lp.q}
          />
        }
      />
    </div>
  );
}
